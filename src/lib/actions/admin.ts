"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { DEFAULT_SECTIONS } from "@/lib/site";
import { ArticleStatus, ContributorRole, type UserRole } from "@/generated/prisma/client";
import {
  articleSchema,
  authorSchema,
  sectionSchema,
  mediaMetaSchema,
  userSchema,
  settingsSchema,
} from "@/lib/validations";
import { persistArticle, persistAuthor } from "@/lib/services/content-writer";
import { storage } from "@/lib/storage";

async function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/buscar");
  const sections = await db.section.findMany({ select: { slug: true } });
  const slugs = sections.length > 0 ? sections.map((s) => s.slug) : DEFAULT_SECTIONS.map((s) => s.slug);
  for (const slug of slugs) revalidatePath(`/${slug}`);
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

  return persistArticle(parsed);
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

  return persistAuthor(parsed);
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
    bannerBgColor: (input.get("bannerBgColor") as string) || null,
    bannerTextColor: (input.get("bannerTextColor") as string) || null,
    bannerButtonBgColor: (input.get("bannerButtonBgColor") as string) || null,
    bannerButtonTextColor: (input.get("bannerButtonTextColor") as string) || null,
    footerCopyright: (input.get("footerCopyright") as string) || null,
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


