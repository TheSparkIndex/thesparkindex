import { z } from "zod";

export const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido. Usa minúsculas, números y guiones.");

export const articleSchema = z.object({
  title: z.string().min(3, "El título es demasiado corto.").max(200),
  slug: slugSchema,
  subtitle: z.string().max(300).nullable().optional(),
  excerpt: z.string().max(600).nullable().optional(),
  content: z.array(z.any()).nullable().optional(),
  sectionId: z.string().nullable().optional(),
  heroMediaId: z.string().nullable().optional(),
  imageCaption: z.string().max(600).nullable().optional(),
  status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
  featured: z.boolean().optional(),
  scheduledAt: z.coerce.date().nullable().optional(),
  seoTitle: z.string().max(70).nullable().optional(),
  seoDescription: z.string().max(170).nullable().optional(),
  contributors: z
    .array(
      z.object({
        authorId: z.string(),
        role: z.enum(["author", "collaborator", "photographer", "editor"]),
      })
    )
    .optional(),
  tags: z.array(z.string()).optional(),
});

export type ArticleInput = z.infer<typeof articleSchema>;

export const authorSchema = z.object({
  name: z.string().min(2, "El nombre es demasiado corto.").max(120),
  slug: slugSchema,
  bio: z.string().max(2000).nullable().optional(),
  photoId: z.string().nullable().optional(),
  role: z.string().max(80).nullable().optional(),
  program: z.string().max(120).nullable().optional(),
  cohort: z.string().max(80).nullable().optional(),
  socialLinks: z
    .object({
      instagram: z.string().max(200).nullable().optional(),
      linkedin: z.string().max(200).nullable().optional(),
      github: z.string().max(200).nullable().optional(),
      twitter: z.string().max(200).nullable().optional(),
    })
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export type AuthorInput = z.infer<typeof authorSchema>;

export const sectionSchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugSchema,
  description: z.string().max(600).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido.")
    .optional(),
  imageId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type SectionInput = z.infer<typeof sectionSchema>;

export const mediaMetaSchema = z.object({
  altText: z.string().max(300).nullable().optional(),
  caption: z.string().max(600).nullable().optional(),
  credit: z.string().max(300).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
});

export const userSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email("Correo inválido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(200)
    .optional(),
  role: z.enum(["viewer", "author", "editor", "admin", "superadmin"]),
  isActive: z.boolean().optional(),
});

export const settingsSchema = z.object({
  siteName: z.string().max(120).optional(),
  tagline: z.string().max(200).optional(),
  instagram: z.string().max(200).nullable().optional(),
  tiktok: z.string().max(200).nullable().optional(),
  twitter: z.string().max(200).nullable().optional(),
  description: z.string().max(300).optional(),
  bannerBgColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hexadecimal (ej. #026DFD)")
    .nullable()
    .optional(),
  bannerTextColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hexadecimal (ej. #ffffff)")
    .nullable()
    .optional(),
  bannerButtonBgColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hexadecimal (ej. #f5f500)")
    .nullable()
    .optional(),
  bannerButtonTextColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hexadecimal (ej. #16161a)")
    .nullable()
    .optional(),
  footerCopyright: z.string().max(200).nullable().optional(),
});
