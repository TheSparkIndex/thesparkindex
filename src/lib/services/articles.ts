import { db } from "@/lib/db";
import { Prisma, ArticleStatus } from "@/generated/prisma/client";
import type { Article } from "@/generated/prisma/client";

export const articleInclude = {
  section: true,
  heroMedia: true,
  authors: {
    include: { author: { include: { photo: true } } },
    orderBy: { sortOrder: "asc" as const },
  },
  media: {
    include: { media: true },
    orderBy: { sortOrder: "asc" as const },
  },
  tags: true,
} satisfies Prisma.ArticleInclude;

export type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: typeof articleInclude;
}>;

const PUBLISHED = ArticleStatus.published;
const SCHEDULED = ArticleStatus.scheduled;

function paginationArgs(opts: { page?: number; perPage?: number }, defaultPerPage: number) {
  return {
    page: Math.max(1, opts.page ?? 1),
    perPage: opts.perPage ?? defaultPerPage,
  };
}

function paginationMeta(total: number, page: number, perPage: number) {
  return { page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** Promote scheduled articles whose time has come. Safe to call on any request. */
export async function publishDueArticles(): Promise<void> {
  await db.article.updateMany({
    where: {
      status: SCHEDULED,
      scheduledAt: { lte: new Date() },
    },
    data: {
      status: PUBLISHED,
      publishedAt: new Date(),
      scheduledAt: null,
    },
  });
}

function publishedWhere(extra: Prisma.ArticleWhereInput = {}): Prisma.ArticleWhereInput {
  return {
    status: PUBLISHED,
    publishedAt: { lte: new Date() },
    ...extra,
  };
}

export async function getFeaturedArticle() {
  await publishDueArticles();
  return db.article.findFirst({
    where: publishedWhere({ featured: true }),
    include: articleInclude,
    orderBy: [{ featuredAt: "desc" }, { publishedAt: "desc" }],
  });
}

export async function getLatestArticles(limit = 6) {
  await publishDueArticles();
  return db.article.findMany({
    where: publishedWhere(),
    include: articleInclude,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getArticlesBySection(
  sectionSlug: string,
  opts: { page?: number; perPage?: number } = {}
) {
  await publishDueArticles();
  const { page, perPage } = paginationArgs(opts, 12);
  const where = publishedWhere({ section: { slug: sectionSlug } });
  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      include: articleInclude,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.article.count({ where }),
  ]);
  return { items, total, ...paginationMeta(total, page, perPage) };
}

export async function getArticleBySlug(slug: string) {
  await publishDueArticles();
  return db.article.findFirst({
    where: publishedWhere({ slug }),
    include: articleInclude,
  });
}

export async function getFeaturedBySection(sectionSlug: string) {
  return db.article.findFirst({
    where: publishedWhere({ section: { slug: sectionSlug }, featured: true }),
    include: articleInclude,
    orderBy: [{ featuredAt: "desc" }, { publishedAt: "desc" }],
  });
}

export async function getRelatedArticles(article: ArticleWithRelations, limit = 3) {
  const sectionId = article.sectionId ?? undefined;
  const tagIds = article.tags.map((t) => t.id);
  const items = await db.article.findMany({
    where: {
      ...publishedWhere(),
      id: { not: article.id },
      OR: [
        ...(sectionId ? [{ sectionId }] : []),
        ...(tagIds.length ? [{ tags: { some: { id: { in: tagIds } } } }] : []),
      ],
    },
    include: articleInclude,
    orderBy: { publishedAt: "desc" },
    take: limit * 2,
  });

  const scored = items
    .map((a) => ({
      article: a,
      score:
        (a.sectionId === sectionId ? 2 : 0) +
        a.tags.filter((t) => tagIds.includes(t.id)).length,
    }))
    .sort((a, b) => b.score - a.score || b.article.publishedAt!.getTime() - a.article.publishedAt!.getTime());
  return scored.slice(0, limit).map((s) => s.article);
}

export async function getArticlesByAuthor(
  authorSlug: string,
  opts: { page?: number; perPage?: number } = {}
) {
  await publishDueArticles();
  const { page, perPage } = paginationArgs(opts, 12);
  const where = publishedWhere({ authors: { some: { author: { slug: authorSlug } } } });
  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      include: articleInclude,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.article.count({ where }),
  ]);
  return { items, total, ...paginationMeta(total, page, perPage) };
}

export type SearchFilters = {
  section?: string;
  author?: string;
  tag?: string;
};

export async function searchArticles(query: string, opts: { page?: number; perPage?: number } = {}, filters: SearchFilters = {}) {
  await publishDueArticles();
  const { page, perPage } = paginationArgs(opts, 12);
  const q = query.trim();

  const baseWhere: Prisma.ArticleWhereInput = {
    ...publishedWhere(),
    ...(filters.section ? { section: { slug: filters.section } } : {}),
    ...(filters.author ? { authors: { some: { author: { slug: filters.author } } } } : {}),
    ...(filters.tag ? { tags: { some: { slug: filters.tag } } } : {}),
  };

  if (!q) {
    const [items, total] = await Promise.all([
      db.article.findMany({
        where: baseWhere,
        include: articleInclude,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      db.article.count({ where: baseWhere }),
    ]);
    return { items, total, ...paginationMeta(total, page, perPage) };
  }

  // Accent-insensitive matching via the unaccent extension. Pattern is
  // escaped so % and _ in the query behave literally, like Prisma's contains.
  const escaped = q.replace(/[\\%_]/g, (c) => "\\" + c);
  const pattern = `%${escaped}%`;

  const matchFragments: Prisma.Sql[] = [
    Prisma.sql`unaccent("Article"."title") ILIKE unaccent(${pattern})`,
    Prisma.sql`unaccent(coalesce("Article"."subtitle", '')) ILIKE unaccent(${pattern})`,
    Prisma.sql`unaccent(coalesce("Article"."excerpt", '')) ILIKE unaccent(${pattern})`,
    Prisma.sql`EXISTS (SELECT 1 FROM "_ArticleToTag" _t JOIN "Tag" _tag ON _tag."id" = _t."B" WHERE _t."A" = "Article"."id" AND unaccent(_tag."name") ILIKE unaccent(${pattern}))`,
    Prisma.sql`EXISTS (SELECT 1 FROM "ArticleAuthor" _aa JOIN "Author" _au ON _au."id" = _aa."authorId" WHERE _aa."articleId" = "Article"."id" AND unaccent(_au."name") ILIKE unaccent(${pattern}))`,
  ];

  const filterFragments: Prisma.Sql[] = [];
  if (filters.section)
    filterFragments.push(
      Prisma.sql`EXISTS (SELECT 1 FROM "Section" _s WHERE _s."id" = "Article"."sectionId" AND _s."slug" = ${filters.section})`
    );
  if (filters.author)
    filterFragments.push(
      Prisma.sql`EXISTS (SELECT 1 FROM "ArticleAuthor" _aa JOIN "Author" _au ON _au."id" = _aa."authorId" WHERE _aa."articleId" = "Article"."id" AND _au."slug" = ${filters.author})`
    );
  if (filters.tag)
    filterFragments.push(
      Prisma.sql`EXISTS (SELECT 1 FROM "_ArticleToTag" _t JOIN "Tag" _tag ON _tag."id" = _t."B" WHERE _t."A" = "Article"."id" AND _tag."slug" = ${filters.tag})`
    );

  const where = Prisma.sql`
    "status" = 'published' AND "publishedAt" <= now()
    ${filterFragments.length ? Prisma.sql`AND ${Prisma.join(filterFragments, " AND ")}` : Prisma.empty}
    AND (${Prisma.join(matchFragments, " OR ")})
  `;

  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT "Article"."id"
    FROM "Article"
    WHERE ${where}
    ORDER BY "Article"."publishedAt" DESC
    LIMIT ${perPage} OFFSET ${(page - 1) * perPage}
  `;

  const [countRows] = await db.$queryRaw<{ total: number }[]>`
    SELECT count(*)::int AS total
    FROM "Article"
    WHERE ${where}
  `;
  const total = countRows?.total ?? 0;

  if (!rows.length) {
    return { items: [], total, ...paginationMeta(total, page, perPage) };
  }

  const items = await db.article.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    include: articleInclude,
  });
  const byId = new Map(items.map((a) => [a.id, a]));
  const ordered = rows
    .map((r) => byId.get(r.id))
    .filter((a): a is ArticleWithRelations => Boolean(a));

  return { items: ordered, total, ...paginationMeta(total, page, perPage) };
}

/* ================= Admin queries ================= */

export async function adminListArticles(opts: { page?: number; perPage?: number; status?: ArticleStatus } = {}) {
  const { page, perPage } = paginationArgs(opts, 15);
  const where: Prisma.ArticleWhereInput = opts.status ? { status: opts.status } : {};
  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      include: { section: true, authors: { include: { author: true } }, heroMedia: true },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.article.count({ where }),
  ]);
  return { items, total, ...paginationMeta(total, page, perPage) };
}

export async function adminGetArticle(id: string) {
  return db.article.findUnique({ where: { id }, include: articleInclude });
}

export async function adminDashboardStats() {
  const [published, drafts, scheduled, authors, mediaCount, featured, totalArticles] =
    await Promise.all([
      db.article.count({ where: { status: PUBLISHED } }),
      db.article.count({ where: { status: ArticleStatus.draft } }),
      db.article.count({ where: { status: SCHEDULED } }),
      db.author.count({ where: { isActive: true } }),
      db.media.count(),
      db.article.count({ where: { featured: true, status: PUBLISHED } }),
      db.article.count(),
    ]);
  return { published, drafts, scheduled, authors, mediaCount, featured, totalArticles };
}

export type AdminActivityEvent = {
  id: string;
  kind: "article" | "author" | "media";
  label: string;
  status?: ArticleStatus;
  at: Date;
};

export async function adminRecentActivity(limit = 8) {
  const articles = await db.article.findMany({
    take: limit,
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, status: true, updatedAt: true, createdAt: true },
  });
  const authors = await db.author.findMany({
    take: limit,
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true, createdAt: true },
  });
  const media = await db.media.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: { id: true, filename: true, createdAt: true },
  });

  const events: AdminActivityEvent[] = [
    ...articles.map((a) => ({
      id: `a-${a.id}`,
      label: a.title,
      kind: "article" as const,
      status: a.status,
      at: a.updatedAt,
    })),
    ...authors.map((a) => ({
      id: `au-${a.id}`,
      label: a.name,
      kind: "author" as const,
      at: a.updatedAt,
    })),
    ...media.map((m) => ({
      id: `m-${m.id}`,
      label: m.filename,
      kind: "media" as const,
      at: m.createdAt,
    })),
  ];
  events.sort((a, b) => b.at.getTime() - a.at.getTime());
  return events.slice(0, limit);
}

export type { Article };

export async function getVisitorStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [today, thisWeek, thisMonth, total] = await Promise.all([
    db.pageView.count({ where: { createdAt: { gte: todayStart } } }),
    db.pageView.count({ where: { createdAt: { gte: weekStart } } }),
    db.pageView.count({ where: { createdAt: { gte: monthStart } } }),
    db.pageView.count(),
  ]);
  return { today, thisWeek, thisMonth, total };
}
