import type { ArticleWithRelations } from "@/lib/services/articles";
import { readingTime } from "@/lib/utils";

export function cardImage(article: ArticleWithRelations, variant: "thumb" | "card" | "hero" | "wide" | "og"): string | null {
  const variants = article.heroMedia?.variants as
    | Record<string, { url: string }>
    | null
    | undefined;
  return variants?.[variant]?.url ?? article.heroMedia?.url ?? null;
}

export function primaryAuthor(article: ArticleWithRelations) {
  const row = article.authors?.find((a) => a.role === "author") ?? article.authors?.[0];
  return row?.author;
}

export function byline(article: ArticleWithRelations): string {
  const primary = primaryAuthor(article);
  if (!primary) return "";
  const extras = article.authors?.length ?? 0;
  return extras > 1 ? `${primary.name} y otros` : primary.name;
}

export function articleMinutes(article: ArticleWithRelations): number {
  return readingTime(article.content);
}
