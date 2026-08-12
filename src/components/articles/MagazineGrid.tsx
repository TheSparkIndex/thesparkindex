import type { ArticleWithRelations } from "@/lib/services/articles";
import { ArticleCard } from "./ArticleCard";
import { cn } from "@/lib/utils";

/**
 * Editorial "Latest stories" composition:
 * 1 large + 2 small on the first row, then a 3-column row, then 2 medium.
 */
export function MagazineGrid({ articles }: { articles: ArticleWithRelations[] }) {
  if (!articles.length) return null;
  const [first, second, third, ...rest] = articles;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <ArticleCard article={first} variant="large" className="lg:col-span-2" priority />
        {second && (
          <div className="flex flex-col gap-6">
            <ArticleCard article={second} variant="medium" />
            {third && <ArticleCard article={third} variant="medium" />}
          </div>
        )}
      </div>

      {rest.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {rest.slice(0, 4).map((a) => (
            <ArticleCard key={a.id} article={a} variant="small" />
          ))}
        </div>
      )}

      {rest.length > 4 && (
        <div className={cn("grid gap-6 md:gap-8", rest.length > 6 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {rest.slice(4, 8).map((a) => (
            <ArticleCard key={a.id} article={a} variant="medium" />
          ))}
        </div>
      )}
    </div>
  );
}
