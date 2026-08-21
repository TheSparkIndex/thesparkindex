import { db } from "@/lib/db";
import { DEFAULT_SECTIONS, type SectionMeta } from "@/lib/site";

export async function adminListSections() {
  return db.section.findMany({
    include: { image: true, _count: { select: { articles: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPublicSections(): Promise<SectionMeta[]> {
  const rows = await db.section.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  if (rows.length === 0) return DEFAULT_SECTIONS;
  return rows.map((s) => ({
    slug: s.slug,
    label: s.name,
    shortLabel: s.name,
    description: s.description ?? "",
    color: s.color,
    colorVar: `var(--color-sec-${s.slug})`,
  }));
}

export async function getPublicSection(slug: string): Promise<SectionMeta | undefined> {
  const row = await db.section.findFirst({ where: { slug, isActive: true } });
  if (!row) return DEFAULT_SECTIONS.find((s) => s.slug === slug);
  return {
    slug: row.slug,
    label: row.name,
    shortLabel: row.name,
    description: row.description ?? "",
    color: row.color,
    colorVar: `var(--color-sec-${row.slug})`,
  };
}
