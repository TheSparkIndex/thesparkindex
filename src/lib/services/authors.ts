import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { paginationArgs, paginationMeta } from "./pagination";

export const authorInclude = {
  photo: true,
} satisfies Prisma.AuthorInclude;

export type AuthorWithRelations = Prisma.AuthorGetPayload<{ include: typeof authorInclude }>;

export async function getActiveAuthors() {
  return db.author.findMany({
    where: { isActive: true },
    include: authorInclude,
    orderBy: { name: "asc" },
  });
}

export async function getAuthorBySlug(slug: string) {
  return db.author.findFirst({
    where: { slug, isActive: true },
    include: authorInclude,
  });
}

export async function adminListAuthors() {
  return db.author.findMany({
    include: {
      photo: true,
      _count: { select: { articles: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function adminListAuthorsPaginated(opts: { page?: number; perPage?: number } = {}) {
  const { page, perPage } = paginationArgs(opts, 50);
  const [items, total] = await Promise.all([
    db.author.findMany({
      include: {
        photo: true,
        _count: { select: { articles: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.author.count(),
  ]);
  return { items, total, ...paginationMeta(total, page, perPage) };
}

export async function adminGetAuthor(id: string) {
  return db.author.findUnique({
    where: { id },
    include: { photo: true, _count: { select: { articles: true } } },
  });
}
