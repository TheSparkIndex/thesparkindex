"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { DEFAULT_SECTIONS } from "@/lib/site";
import { ArticleStatus, ContributorRole, type Prisma, type UserRole } from "@/generated/prisma/client";
import {
  articleSchema,
  authorSchema,
  sectionSchema,
  mediaMetaSchema,
  userSchema,
  settingsSchema,
} from "@/lib/validations";
import { sanitizeContent } from "@/lib/content/sanitize";
import { slugify } from "@/lib/utils";
import { storage } from "@/lib/storage";

async function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/buscar");
  const sections = await db.section.findMany({ select: { slug: true } });
  const slugs = sections.length > 0 ? sections.map((s) => s.slug) : DEFAULT_SECTIONS.map((s) => s.slug);
  for (const slug of slugs) revalidatePath(`/${slug}`);
}

function toSlug(input: string): string {
  const candidate = slugify(input);
  return candidate || `articulo-${Date.now()}`;
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
  slug?: string | null;
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

type ArticleActionState = { ok?: boolean; error?: string; articleId?: string };

export async function saveArticle(input: FormData): Promise<ArticleActionState> {
  await requireAdmin();

  const raw = Object.fromEntries(input.entries());
  let parsed: z.infer<typeof articleSchema>;
  try {
    parsed = articleSchema.parse({
      ...raw,
      slug: (raw.slug as string) || undefined,
      subtitle: (raw.subtitle as string) || null,
      excerpt: (raw.excerpt as string) || null,
      imageCaption: (raw.imageCaption as string) || null,
      seoTitle: (raw.seoTitle as string) || null,
      seoDescription: (raw.seoDescription as string) || null,
      heroMediaId: (raw.heroMediaId as string) || null,
      sectionId: (raw.sectionId as string) || null,
      featured: raw.featured === "on" || raw.featured === "true",
      status: raw.status === "published" || raw.status === "scheduled" || raw.status === "draft" || raw.status === "archived" ? raw.status : "draft",
      scheduledAt: raw.scheduledAt ? new Date(raw.scheduledAt as string) : null,
      content: JSON.parse((raw.content as string) ?? "[]"),
      contributors: JSON.parse((raw.contributors as string) ?? "[]"),
      tags: JSON.parse((raw.tags as string) ?? "[]"),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.issues.map((err) => err.message).join(" · ") };
    }
    return { error: "Datos inválidos." };
  }

  const slug = parsed.slug || toSlug(parsed.title ?? "");
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
      slug,
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
          publishedAt: publishNow ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
          featuredAt: parsed.featured ? (existing.featuredAt ?? new Date()) : existing.featuredAt,
          tags: { set: [], connect: tags.map((t) => ({ id: t.id })) },
          authors: { deleteMany: {} },
        },
      });
      await setContributors(existing.id, parsed.contributors ?? []);
      revalidateAll();
      return { ok: true, articleId: existing.id };
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
        publishedAt: publishNow ? new Date() : null,
        featuredAt: parsed.featured ? new Date() : null,
        tags: { connect: tags.map((t) => ({ id: t.id })) },
      },
    });
    await setContributors(article.id, parsed.contributors ?? []);
    revalidateAll();
    return { ok: true, articleId: article.id };
  } catch {
    return { error: "No se pudo guardar el artículo. Revisa que el slug no esté repetido." };
  }
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

export async function deleteArticle(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    await db.article.delete({ where: { id } });
    revalidateAll();
    return {};
  } catch {
    return { error: "No se pudo eliminar el artículo." };
  }
}

export async function setArticleStatus(
  id: string,
  status: ArticleStatus
): Promise<{ error?: string }> {
  await requireAdmin();
  const article = await db.article.findUnique({ where: { id }, include: { authors: true } });
  if (!article) return { error: "Artículo no encontrado." };

  if (status === ArticleStatus.published) {
    const problems = validatePublishInput({
      title: article.title,
      slug: article.slug,
      sectionId: article.sectionId,
      contributors: article.authors.map((a) => ({ authorId: a.authorId, role: a.role })),
      content: article.content,
      heroMediaId: article.heroMediaId,
    });
    if (problems.length) return { error: `No se puede publicar: ${problems.join(" · ")}` };
  }

  await db.article.update({
    where: { id },
    data: {
      status,
      publishedAt: status === ArticleStatus.published ? (article.publishedAt ?? new Date()) : article.publishedAt,
      scheduledAt: status === ArticleStatus.scheduled ? article.scheduledAt : null,
    },
  });
  revalidateAll();
  return {};
}

export async function toggleFeature(id: string, featured: boolean): Promise<{ error?: string }> {
  await requireAdmin();
  await db.article.update({
    where: { id },
    data: { featured, featuredAt: featured ? new Date() : null },
  });
  revalidateAll();
  return {};
}

/* ============ Authors ============ */

export async function saveAuthor(input: FormData): Promise<{ ok?: boolean; error?: string; authorId?: string }> {
  await requireAdmin();
  let parsed: z.infer<typeof authorSchema>;
  try {
    parsed = authorSchema.parse({
      name: (input.get("name") as string) ?? "",
      slug: (input.get("slug") as string) ?? "",
      bio: (input.get("bio") as string) || null,
      photoId: (input.get("photoId") as string) || null,
      role: (input.get("role") as string) || null,
      program: (input.get("program") as string) || null,
      cohort: (input.get("cohort") as string) || null,
      socialLinks: JSON.parse((input.get("socialLinks") as string) ?? "{}"),
      isActive: input.get("isActive") === "on" || input.get("isActive") === "true",
    });
  } catch (e) {
    if (e instanceof z.ZodError) return { error: e.issues.map((err) => err.message).join(" · ") };
    return { error: "Datos inválidos." };
  }

  const slug = parsed.slug || toSlug(parsed.name);
  const existing = await db.author.findUnique({ where: { slug } });
  const socialLinks = (parsed.socialLinks ?? null) as Prisma.InputJsonValue;

  try {
    if (existing) {
      await db.author.update({
        where: { id: existing.id },
        data: { ...parsed, socialLinks, slug, photoId: parsed.photoId ?? null },
      });
      revalidatePath("/autores");
      return { ok: true, authorId: existing.id };
    }
    const author = await db.author.create({
      data: { ...parsed, socialLinks, slug, photoId: parsed.photoId ?? null },
    });
    revalidatePath("/autores");
    return { ok: true, authorId: author.id };
  } catch {
    return { error: "No se pudo guardar el autor. Revisa el slug." };
  }
}

export async function deleteAuthor(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    await db.author.delete({ where: { id } });
    revalidatePath("/autores");
    return {};
  } catch {
    return { error: "No se pudo eliminar el autor." };
  }
}

/* ============ Sections ============ */

export async function saveSection(input: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  let parsed: z.infer<typeof sectionSchema>;
  try {
    parsed = sectionSchema.parse({
      name: (input.get("name") as string) ?? "",
      slug: (input.get("slug") as string) ?? "",
      description: (input.get("description") as string) || null,
      color: (input.get("color") as string) || "#026DFD",
      imageId: (input.get("imageId") as string) || null,
      isActive: input.get("isActive") === "on" || input.get("isActive") === "true",
      sortOrder: Number(input.get("sortOrder") ?? 0),
    });
  } catch (e) {
    if (e instanceof z.ZodError) return { error: e.issues.map((err) => err.message).join(" · ") };
    return { error: "Datos inválidos." };
  }

  const existing = await db.section.findUnique({ where: { slug: parsed.slug } });
  if (existing) {
    await db.section.update({ where: { id: existing.id }, data: { ...parsed, imageId: parsed.imageId ?? null } });
  } else {
    await db.section.create({ data: { ...parsed, imageId: parsed.imageId ?? null } });
  }
  revalidateAll();
  return { ok: true };
}

export async function deleteSection(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const section = await db.section.findUnique({ where: { id }, include: { _count: { select: { articles: true } } } });
  if (!section) return { error: "Sección no encontrada." };
  if (section._count.articles > 0) return { error: `No se puede eliminar: la sección tiene ${section._count.articles} artículo(s) asociados.` };
  try {
    await db.section.delete({ where: { id } });
    revalidateAll();
    return {};
  } catch {
    return { error: "No se pudo eliminar la sección." };
  }
}

/* ============ Media ============ */

export async function updateMediaMeta(
  id: string,
  meta: z.infer<typeof mediaMetaSchema>
): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  try {
    const parsed = mediaMetaSchema.parse(meta);
    await db.media.update({ where: { id }, data: parsed });
    revalidatePath("/admin/media");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { error: e.issues.map((err) => err.message).join(" · ") };
    return { error: "Datos inválidos." };
  }
}

export async function deleteMedia(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const media = await db.media.findUnique({ where: { id } });
  if (!media) return { error: "Archivo no encontrado." };
  try {
    const variants = (media.variants ?? {}) as Record<string, { key: string }>;
    await storage.delete(media.url.replace(/^\/media\//, ""));
    for (const v of Object.values(variants)) {
      await storage.delete(v.key);
    }
    await db.media.delete({ where: { id } });
    revalidatePath("/admin/media");
    return {};
  } catch {
    return { error: "No se pudo eliminar el archivo." };
  }
}

/* ============ Users ============ */

export async function saveUser(input: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  let parsed: z.infer<typeof userSchema>;
  try {
    parsed = userSchema.parse({
      name: (input.get("name") as string) ?? "",
      email: (input.get("email") as string) ?? "",
      password: (input.get("password") as string) || undefined,
      role: (input.get("role") as UserRole) ?? "viewer",
      isActive: input.get("isActive") === "on" || input.get("isActive") === "true",
    });
  } catch (e) {
    if (e instanceof z.ZodError) return { error: e.issues.map((err) => err.message).join(" · ") };
    return { error: "Datos inválidos." };
  }

  const id = (input.get("id") as string) || null;
  if (id) {
    const data: Record<string, unknown> = { name: parsed.name, email: parsed.email, role: parsed.role, isActive: parsed.isActive ?? true };
    if (parsed.password) {
      const bcrypt = (await import("bcryptjs")).default;
      data.passwordHash = await bcrypt.hash(parsed.password, 12);
    }
    await db.user.update({ where: { id }, data: data as never });
  } else {
    if (!parsed.password) return { error: "La contraseña es obligatoria para usuarios nuevos." };
    const bcrypt = (await import("bcryptjs")).default;
    const hash = await bcrypt.hash(parsed.password, 12);
    await db.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        role: parsed.role,
        isActive: parsed.isActive ?? true,
        passwordHash: hash,
      },
    });
  }
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function deleteUser(id: string): Promise<{ error?: string }> {
  const session = await requireAdmin();
  if (session.user.id === id) return { error: "No puedes eliminar tu propio usuario." };
  await db.user.delete({ where: { id } });
  revalidatePath("/admin/usuarios");
  return {};
}

/* ============ Settings ============ */

export async function saveSettings(input: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  const raw: Record<string, unknown> = {
    siteName: (input.get("siteName") as string) || null,
    tagline: (input.get("tagline") as string) || null,
    instagram: (input.get("instagram") as string) || null,
    tiktok: (input.get("tiktok") as string) || null,
    twitter: (input.get("twitter") as string) || null,
    description: (input.get("description") as string) || null,
    bannerTitle: (input.get("bannerTitle") as string) || null,
    bannerSubtitle: (input.get("bannerSubtitle") as string) || null,
    bannerArticleSlug: (input.get("bannerArticleSlug") as string) || null,
    bannerEnabled: input.get("bannerEnabled") === "on" || input.get("bannerEnabled") === "true",
  };
  try {
    settingsSchema.parse(raw);
  } catch (e) {
    if (e instanceof z.ZodError) return { error: e.issues.map((err) => err.message).join(" · ") };
  }
  for (const [key, value] of Object.entries(raw)) {
    await db.setting.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
  }
  revalidatePath("/");
  return { ok: true };
}


