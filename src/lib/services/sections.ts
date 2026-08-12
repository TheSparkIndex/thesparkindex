import { db } from "@/lib/db";

export async function adminListSections() {
  return db.section.findMany({
    include: { image: true, _count: { select: { articles: true } } },
    orderBy: { sortOrder: "asc" },
  });
}
