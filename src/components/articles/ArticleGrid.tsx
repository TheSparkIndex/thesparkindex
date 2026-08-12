import type { ArticleWithRelations } from "@/lib/services/articles";
import { ArticleCard } from "./ArticleCard";

export function ArticleGrid({
  articles,
  variant = "medium",
  columns = "sm:grid-cols-2 lg:grid-cols-3",
  className,
}: {
  articles: ArticleWithRelations[];
  variant?: "small" | "medium" | "large";
  columns?: string;
  className?: string;
}) {
  if (!articles.length) return null;
  return (
    <div className={`grid gap-6 md:gap-8 ${columns} ${className ?? ""}`}>
      {articles.map((a) => (
        <ArticleCard key={a.id} article={a} variant={variant} />
      ))}
    </div>
  );
}
