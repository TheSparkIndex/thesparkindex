import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { DEFAULT_SECTIONS } from "@/lib/site";
import { ArticleStatus, ContributorRole, type Prisma } from "@/generated/prisma/client";
import { articleSchema, authorSchema } from "@/lib/validations";
import { sanitizeContent } from "@/lib/content/sanitize";
import { slugify } from "@/lib/utils";

/**
 * Escritura de artículos y autores compartida por el panel (Server Actions)
 * y por la API de contenido (/api/v1). La autorización la hace quien llama.
 */

export type ArticleInput = z.infer<typeof articleSchema> & {
  /** Fecha de publicación explícita (p. ej. artículos históricos). Solo aplica al publicar. */
  publishedAt?: Date | null;
};
export type ArticleWriteResult = { ok?: boolean; error?: string; articleId?: string; slug?: string };

export type AuthorInput = z.infer<typeof authorSchema>;
export type AuthorWriteResult = { ok?: boolean; error?: string; authorId?: string; slug?: string };

export async function revalidatePublicPages() {
  revalidatePath("/");
  revalidatePath("/buscar");
  const sections = await db.section.findMany({ select: { slug: true } });
  const slugs = sections.length > 0 ? sections.map((s) => s.slug) : DEFAULT_SECTIONS.map((s) => s.slug);
  for (const slug of slugs) revalidatePath(`/${slug}`);
}

function toSlug(input: string, fallbackPrefix: string): string {
  return slugify(input) || `${fallbackPrefix}-${Date.now()}`;
}

async function upsertTags(names: string[]): Promise<{ id: string; name: string; slug: string }[]> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 10);
  const tags: { id: string; name: string; slug: string }[] = [];
  for (const name of unique) {
    const slug = slugify(name) || `tag-${Date.now()}`;
    const tag = await db.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    tags.push(tag);
  }
  return tags;
}

function validatePublishInput(article: {
  title?: string | null;
  sectionId?: string | null;
  contributors?: Array<{ authorId: string; role: ContributorRole }>;
  content?: unknown;
  heroMediaId?: string | null;
}) {
  const errors: string[] = [];
  if (!article.title?.trim()) errors.push("El título es obligatorio.");
  if (!article.sectionId) errors.push("Debes asignar una sección.");
  if (!article.contributors?.length) errors.push("Debes asignar al menos un autor.");
  const content = article.content ?? [];
  if (Array.isArray(content) && content.length === 0) errors.push("El contenido está vacío.");
  if (!article.heroMediaId) errors.push("Debes subir una imagen de portada.");
  return errors;
}

async function setContributors(
  articleId: string,
  contributors: Array<{ authorId: string; role: ContributorRole }>
) {
  const unique = new Map<string, ContributorRole>();
  for (const c of contributors.slice(0, 12)) {
    if (!unique.has(c.authorId)) unique.set(c.authorId, c.role);
  }
  let order = 0;
  for (const [authorId, role] of unique) {
    await db.articleAuthor.create({
      data: { articleId, authorId, role, sortOrder: order++ },
    });
  }
}

/** Crea o actualiza (por slug) un artículo ya validado con articleSchema. */
export async function persistArticle(parsed: ArticleInput): Promise<ArticleWriteResult> {
  const slug = parsed.slug || toSlug(parsed.title ?? "", "articulo");
  const content = sanitizeContent(parsed.content) as Prisma.InputJsonValue;
  const tags = await upsertTags(parsed.tags ?? []);
  const isScheduled = parsed.status === "scheduled";
  const isPublished = parsed.status === "published";

  if (isScheduled && !parsed.scheduledAt) {
    return { error: "Si programas un artículo debes indicar la fecha de publicación." };
  }
  if (isScheduled && parsed.scheduledAt && parsed.scheduledAt <= new Date()) {
    return { error: "La fecha de programación debe ser futura." };
  }
  if (isPublished || (parsed.status === "scheduled" && !parsed.scheduledAt)) {
    const problems = validatePublishInput({
      title: parsed.title,
      sectionId: parsed.sectionId,
      contributors: parsed.contributors as Array<{ authorId: string; role: ContributorRole }>,
      content,
      heroMediaId: parsed.heroMediaId,
    });
    if (problems.length) {
      return { error: problems.join(" · ") };
    }
  }

  const publishNow = isPublished || (isScheduled && parsed.scheduledAt && parsed.scheduledAt <= new Date());
  const effectiveScheduledAt = isScheduled && parsed.scheduledAt && parsed.scheduledAt > new Date() ? parsed.scheduledAt : null;
  const explicitPublishedAt = parsed.publishedAt ?? null;

  try {
    const existing = await db.article.findUnique({ where: { slug } });
    const data = {
      title: parsed.title!,
      slug,
      subtitle: parsed.subtitle ?? null,
      excerpt: parsed.excerpt ?? null,
      content,
      sectionId: parsed.sectionId ?? null,
      heroMediaId: parsed.heroMediaId ?? null,
      imageCaption: parsed.imageCaption ?? null,
      featured: parsed.featured ?? false,
      seoTitle: parsed.seoTitle ?? null,
      seoDescription: parsed.seoDescription ?? null,
    };

    if (existing) {
      await db.article.update({
        where: { id: existing.id },
        data: {
          ...data,
          status: publishNow
            ? ArticleStatus.published
            : parsed.status === "scheduled"
              ? ArticleStatus.scheduled
              : (parsed.status as ArticleStatus),
          scheduledAt: effectiveScheduledAt,
          publishedAt: publishNow
            ? (explicitPublishedAt ?? existing.publishedAt ?? new Date())
            : existing.publishedAt,
          featuredAt: parsed.featured ? (existing.featuredAt ?? new Date()) : existing.featuredAt,
          tags: { set: [], connect: tags.map((t) => ({ id: t.id })) },
          authors: { deleteMany: {} },
        },
      });
      await setContributors(existing.id, parsed.contributors ?? []);
      await revalidatePublicPages();
      return { ok: true, articleId: existing.id, slug };
    }

    const article = await db.article.create({
      data: {
        ...data,
        status: publishNow
          ? ArticleStatus.published
          : parsed.status === "scheduled"
            ? ArticleStatus.scheduled
            : ArticleStatus.draft,
        scheduledAt: effectiveScheduledAt,
        publishedAt: publishNow ? (explicitPublishedAt ?? new Date()) : null,
        featuredAt: parsed.featured ? new Date() : null,
        tags: { connect: tags.map((t) => ({ id: t.id })) },
      },
    });
    await setContributors(article.id, parsed.contributors ?? []);
    await revalidatePublicPages();
    return { ok: true, articleId: article.id, slug };
  } catch {
    return { error: "No se pudo guardar el artículo. Revisa que el slug no esté repetido." };
  }
}

/** Crea o actualiza (por slug) un autor ya validado con authorSchema. */
export async function persistAuthor(parsed: AuthorInput): Promise<AuthorWriteResult> {
  const slug = parsed.slug || toSlug(parsed.name, "autor");
  const existing = await db.author.findUnique({ where: { slug } });
  const socialLinks = (parsed.socialLinks ?? null) as Prisma.InputJsonValue;

  try {
    if (existing) {
      await db.author.update({
        where: { id: existing.id },
        data: { ...parsed, socialLinks, slug, photoId: parsed.photoId ?? null },
      });
      revalidatePath("/autores");
      return { ok: true, authorId: existing.id, slug };
    }
    const author = await db.author.create({
      data: { ...parsed, socialLinks, slug, photoId: parsed.photoId ?? null },
    });
    revalidatePath("/autores");
    return { ok: true, authorId: author.id, slug };
  } catch {
    return { error: "No se pudo guardar el autor. Revisa el slug." };
  }
}
