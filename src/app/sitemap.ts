import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";
import { ArticleStatus } from "@/generated/prisma/client";

// Se regenera cada hora para incluir artículos nuevos sin reconstruir la app.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sections, articles, authors] = await Promise.all([
    db.section.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.article.findMany({
      where: { status: ArticleStatus.published, publishedAt: { lte: new Date() } },
      select: { slug: true, updatedAt: true, featured: true },
    }),
    db.author.findMany({ where: { isActive: true }, select: { slug: true } }),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: SITE.url, changeFrequency: "daily", priority: 1 },
    ...sections.map((s) => ({
      url: `${SITE.url}/${s.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...articles.map((a) => ({
      url: `${SITE.url}/articulos/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: a.featured ? 0.9 : 0.7,
    })),
    ...authors.map((a) => ({
      url: `${SITE.url}/autores/${a.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  return entries;
}
