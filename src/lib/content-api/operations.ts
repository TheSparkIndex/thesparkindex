import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import path from "node:path";
import { z } from "zod";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";
import { articleSchema, authorSchema } from "@/lib/validations";
import { markdownToTiptap } from "@/lib/content/markdown";
import { persistArticle, persistAuthor } from "@/lib/services/content-writer";
import { MAX_UPLOAD_BYTES, storeUploadedImage } from "@/lib/services/media";
import { slugify } from "@/lib/utils";
import type { ArticleStatus } from "@/generated/prisma/client";

/**
 * Operaciones de contenido compartidas por la API REST (/api/v1) y el MCP remoto (/api/mcp).
 * Quien llama se encarga de la autorización.
 */

export type OpResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };
const fail = (status: number, error: string): OpResult<never> => ({ ok: false, status, error });

const STATUSES = ["draft", "scheduled", "published", "archived"] as const;
const ROLES = ["author", "collaborator", "photographer", "editor"] as const;
type Role = (typeof ROLES)[number];

const zodMessage = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · ");

/* ---------------------------------- Lecturas --------------------------------- */

export async function listSections() {
  return db.section.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, name: true, description: true, isActive: true },
  });
}

export async function listAuthors() {
  return db.author.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, role: true, program: true, isActive: true },
  });
}

export async function listArticles(opts: { status?: string | null; q?: string | null; take?: number }) {
  const take = Math.min(Math.max(opts.take ?? 50, 1), 200);
  const status = opts.status && (STATUSES as readonly string[]).includes(opts.status) ? opts.status : null;
  const articles = await db.article.findMany({
    where: {
      ...(status ? { status: status as ArticleStatus } : {}),
      ...(opts.q?.trim() ? { title: { contains: opts.q.trim(), mode: "insensitive" as const } } : {}),
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
  return articles.map((a) => ({ ...a, url: `${SITE.url}/articulos/${a.slug}` }));
}

export async function getArticle(slug: string) {
  return db.article.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      excerpt: true,
      content: true,
      status: true,
      featured: true,
      publishedAt: true,
      scheduledAt: true,
      imageCaption: true,
      heroMedia: { select: { id: true, url: true, altText: true } },
      section: { select: { slug: true, name: true } },
      tags: { select: { name: true } },
      authors: { orderBy: { sortOrder: "asc" }, select: { role: true, author: { select: { slug: true, name: true } } } },
    },
  });
}

/* ---------------------------------- Autores ---------------------------------- */

export async function upsertAuthor(body: Record<string, unknown>): Promise<OpResult<{ id: string; slug: string; created: boolean }>> {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(name);
  const existing = slug ? await db.author.findUnique({ where: { slug } }) : null;

  let parsed: z.infer<typeof authorSchema>;
  try {
    parsed = authorSchema.parse({
      name: name || existing?.name || "",
      slug,
      bio: body.bio ?? existing?.bio ?? null,
      // Si no se envía foto, se conserva la actual.
      photoId: body.photoId ?? existing?.photoId ?? null,
      role: body.role ?? existing?.role ?? null,
      program: body.program ?? existing?.program ?? null,
      cohort: body.cohort ?? existing?.cohort ?? null,
      socialLinks: body.socialLinks ?? existing?.socialLinks ?? null,
      isActive: typeof body.isActive === "boolean" ? body.isActive : (existing?.isActive ?? true),
    });
  } catch (e) {
    return fail(400, e instanceof z.ZodError ? zodMessage(e) : "Datos inválidos.");
  }

  const result = await persistAuthor(parsed);
  if (!result.ok || !result.authorId || !result.slug) return fail(422, result.error ?? "No se pudo guardar el autor.");
  return { ok: true, data: { id: result.authorId, slug: result.slug, created: !existing } };
}

/* --------------------------------- Artículos --------------------------------- */

const contributorInput = z.object({
  slug: z.string().optional(),
  id: z.string().optional(),
  role: z.enum(ROLES).default("author"),
});

/**
 * Crea o actualiza (por slug) un artículo.
 * body: title, slug?, subtitle?, excerpt?, markdown | content, section | sectionId,
 *       authors [{ slug | id, role }], heroMediaId?, imageCaption?, tags?, status?,
 *       featured?, publishedAt?, scheduledAt?, seoTitle?, seoDescription?
 */
export async function upsertArticle(body: Record<string, unknown>): Promise<
  OpResult<{ id: string; slug: string; status: string; publishedAt: Date | null; created: boolean; blocks: number; url: string }>
> {
  let sectionId = typeof body.sectionId === "string" ? body.sectionId : null;
  if (!sectionId && typeof body.section === "string" && body.section.trim()) {
    const section = await db.section.findUnique({ where: { slug: body.section.trim() } });
    if (!section) return fail(422, `No existe la sección '${body.section}'. Consulta la lista de secciones.`);
    sectionId = section.id;
  }

  const rawAuthors = z.array(contributorInput).safeParse(body.authors ?? []);
  if (!rawAuthors.success) return fail(400, "authors debe ser una lista de { slug | id, role }.");
  const contributors: Array<{ authorId: string; role: Role }> = [];
  for (const c of rawAuthors.data) {
    const author = c.id
      ? await db.author.findUnique({ where: { id: c.id } })
      : c.slug
        ? await db.author.findUnique({ where: { slug: c.slug } })
        : null;
    if (!author) return fail(422, `No existe el autor '${c.slug ?? c.id}'. Créalo primero.`);
    contributors.push({ authorId: author.id, role: c.role });
  }

  if (typeof body.heroMediaId === "string") {
    const media = await db.media.findUnique({ where: { id: body.heroMediaId } });
    if (!media) return fail(422, `No existe la imagen '${body.heroMediaId}'.`);
  }

  let content: unknown[] = [];
  if (typeof body.markdown === "string") content = markdownToTiptap(body.markdown);
  else if (Array.isArray(body.content)) content = body.content;

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const slug = typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(title);
  const status = typeof body.status === "string" && (STATUSES as readonly string[]).includes(body.status) ? body.status : "draft";

  let publishedAt: Date | null = null;
  if (body.publishedAt) {
    const d = new Date(String(body.publishedAt));
    if (Number.isNaN(d.getTime())) return fail(400, "publishedAt no es una fecha válida (usa ISO 8601).");
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
    return fail(400, e instanceof z.ZodError ? zodMessage(e) : "Datos inválidos.");
  }

  const existed = !!(await db.article.findUnique({ where: { slug }, select: { id: true } }));
  const result = await persistArticle({ ...parsed, publishedAt });
  if (!result.ok) return fail(422, result.error ?? "No se pudo guardar el artículo.");

  const saved = await db.article.findUniqueOrThrow({
    where: { id: result.articleId },
    select: { id: true, slug: true, status: true, publishedAt: true },
  });
  return {
    ok: true,
    data: { ...saved, created: !existed, blocks: content.length, url: `${SITE.url}/articulos/${saved.slug}` },
  };
}

/* ---------------------------- Imágenes desde URL ----------------------------- */

/** Busca una imagen de la biblioteca por su URL (/media/... o absoluta del sitio). */
export async function findMediaByUrl(src: string) {
  const relative = src.startsWith(SITE.url) ? src.slice(SITE.url.length) : src;
  if (!relative.startsWith("/media/")) return null;
  return db.media.findFirst({ where: { url: relative } });
}

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return isPrivateAddress(v.slice(7));
    return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`URL inválida: ${raw}`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Solo se aceptan URLs http(s).");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((r) => r.address);
  if (!addresses.length || addresses.some(isPrivateAddress)) {
    throw new Error("La URL apunta a una dirección no pública.");
  }
  return url;
}

/** Descarga una imagen pública (máx. 10 MB, hasta 5 redirecciones) y la guarda en la biblioteca. */
export async function importImageFromUrl(
  rawUrl: string,
  meta: { altText?: string | null; caption?: string | null; credit?: string | null } = {}
) {
  let url = await assertPublicUrl(rawUrl);
  let res: Response | null = null;
  for (let hop = 0; hop <= 5; hop++) {
    res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20_000) });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      url = await assertPublicUrl(new URL(location, url).toString());
      continue;
    }
    break;
  }
  if (!res || !res.ok) throw new Error(`No se pudo descargar la imagen (HTTP ${res?.status ?? "?"}).`);

  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES) throw new Error("La imagen supera el tamaño máximo de 10MB.");
  const buffer = Buffer.from(await res.arrayBuffer());

  const ext = path.extname(url.pathname).toLowerCase();
  let mimeType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!mimeType.startsWith("image/")) mimeType = MIME_BY_EXT[ext] ?? mimeType;
  if (mimeType === "image/svg+xml") throw new Error("Por seguridad no se importan SVG desde URL.");

  const filename = path.basename(url.pathname) || "imagen";
  return storeUploadedImage(buffer, mimeType, filename, meta);
}
