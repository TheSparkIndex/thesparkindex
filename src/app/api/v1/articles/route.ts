import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";
import { badRequest, requireApiToken } from "@/lib/content-api/auth";
import { articleSchema } from "@/lib/validations";
import { markdownToTiptap } from "@/lib/content/markdown";
import { persistArticle } from "@/lib/services/content-writer";
import { slugify } from "@/lib/utils";
import type { ArticleStatus } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["draft", "scheduled", "published", "archived"] as const;

export async function GET(req: Request) {
  const denied = requireApiToken(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q")?.trim();
  const take = Math.min(Math.max(Number(url.searchParams.get("take") ?? 50), 1), 200);

  const articles = await db.article.findMany({
    where: {
      ...(status && (STATUSES as readonly string[]).includes(status) ? { status: status as ArticleStatus } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      featured: true,
      publishedAt: true,
      scheduledAt: true,
      updatedAt: true,
      heroMediaId: true,
      section: { select: { slug: true, name: true } },
      authors: { orderBy: { sortOrder: "asc" }, select: { role: true, author: { select: { slug: true, name: true } } } },
    },
  });
  return NextResponse.json({
    articles: articles.map((a) => ({ ...a, url: `${SITE.url}/articulos/${a.slug}` })),
  });
}

const contributorInput = z.object({
  slug: z.string().optional(),
  id: z.string().optional(),
  role: z.enum(["author", "collaborator", "photographer", "editor"]).default("author"),
});

/**
 * Crea o actualiza (por slug) un artículo.
 * Contenido: `markdown` (recomendado) o `content` (JSON de TipTap).
 * Sección por `section` (slug) o `sectionId`. Autores por slug o id.
 */
export async function POST(req: Request) {
  const denied = requireApiToken(req);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("El cuerpo debe ser JSON.");
  }

  // Sección
  let sectionId = typeof body.sectionId === "string" ? body.sectionId : null;
  if (!sectionId && typeof body.section === "string" && body.section.trim()) {
    const section = await db.section.findUnique({ where: { slug: body.section.trim() } });
    if (!section) return badRequest(`No existe la sección '${body.section}'. Consulta GET /api/v1/sections.`, 422);
    sectionId = section.id;
  }

  // Autores
  const rawAuthors = z.array(contributorInput).safeParse(body.authors ?? []);
  if (!rawAuthors.success) return badRequest("authors debe ser una lista de { slug | id, role }.");
  const contributors: Array<{ authorId: string; role: "author" | "collaborator" | "photographer" | "editor" }> = [];
  for (const c of rawAuthors.data) {
    const author = c.id
      ? await db.author.findUnique({ where: { id: c.id } })
      : c.slug
        ? await db.author.findUnique({ where: { slug: c.slug } })
        : null;
    if (!author) return badRequest(`No existe el autor '${c.slug ?? c.id}'. Créalo con POST /api/v1/authors.`, 422);
    contributors.push({ authorId: author.id, role: c.role });
  }

  // Imagen de portada
  if (typeof body.heroMediaId === "string") {
    const media = await db.media.findUnique({ where: { id: body.heroMediaId } });
    if (!media) return badRequest(`No existe la imagen '${body.heroMediaId}'.`, 422);
  }

  // Contenido
  let content: unknown[] = [];
  if (typeof body.markdown === "string") content = markdownToTiptap(body.markdown);
  else if (Array.isArray(body.content)) content = body.content;

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const slug = typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(title);
  const status = typeof body.status === "string" && (STATUSES as readonly string[]).includes(body.status) ? body.status : "draft";

  let publishedAt: Date | null = null;
  if (body.publishedAt) {
    const d = new Date(String(body.publishedAt));
    if (Number.isNaN(d.getTime())) return badRequest("publishedAt no es una fecha válida (usa ISO 8601).");
    publishedAt = d;
  }

  let parsed: z.infer<typeof articleSchema>;
  try {
    parsed = articleSchema.parse({
      title,
      slug,
      subtitle: body.subtitle ?? null,
      excerpt: body.excerpt ?? null,
      content,
      sectionId,
      heroMediaId: body.heroMediaId ?? null,
      imageCaption: body.imageCaption ?? null,
      status,
      featured: body.featured === true,
      scheduledAt: body.scheduledAt ?? null,
      seoTitle: body.seoTitle ?? null,
      seoDescription: body.seoDescription ?? null,
      contributors,
      tags: Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string") : [],
    });
  } catch (e) {
    if (e instanceof z.ZodError) return badRequest(e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · "));
    return badRequest("Datos inválidos.");
  }

  const existed = !!(await db.article.findUnique({ where: { slug }, select: { id: true } }));
  const result = await persistArticle({ ...parsed, publishedAt });
  if (!result.ok) return badRequest(result.error ?? "No se pudo guardar el artículo.", 422);

  const saved = await db.article.findUnique({
    where: { id: result.articleId },
    select: { id: true, slug: true, status: true, publishedAt: true },
  });
  return NextResponse.json({
    ...saved,
    created: !existed,
    blocks: content.length,
    url: `${SITE.url}/articulos/${saved?.slug}`,
  });
}
