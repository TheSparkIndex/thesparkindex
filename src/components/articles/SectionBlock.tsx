import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSection, type SectionMeta } from "@/lib/site";
import type { ArticleWithRelations } from "@/lib/services/articles";
import { ArticleCard } from "@/components/articles/ArticleCard";

export function SectionBlock({
  sectionSlug,
  articles,
  layout = "row",
  meta: metaProp,
}: {
  sectionSlug: string;
  articles: ArticleWithRelations[];
  layout?: "row" | "list" | "single";
  meta?: SectionMeta;
}) {
  const meta = metaProp ?? getSection(sectionSlug);
  if (!articles.length) return null;

  return (
    <section className="border-t-2 border-key-ink/80 py-12 sm:py-16">
      <div className="container-key">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-8 w-2 rounded-full" style={{ backgroundColor: meta?.color }} aria-hidden />
            <div>
              <h2 className="display text-3xl sm:text-4xl" style={{ color: meta?.color }}>
                {meta?.shortLabel}
              </h2>
              {meta?.description && (
                <p className="mt-1 line-clamp-1 max-w-xl text-sm leading-6 text-key-muted">{meta.description}</p>
              )}
            </div>
          </div>
          <Link
            href={`/${sectionSlug}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-key-ink transition-colors hover:text-key-primary"
          >
            Ver todo <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        {layout === "row" && (
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            <ArticleCard article={articles[0]} variant="large" className="lg:col-span-2" />
            <div className="flex flex-col gap-6">
              {articles.slice(1, 3).map((a) => (
                <ArticleCard key={a.id} article={a} variant="medium" />
              ))}
            </div>
          </div>
        )}

        {layout === "list" && (
          <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.slice(0, 3).map((a) => (
              <ArticleCard key={a.id} article={a} variant="medium" />
            ))}
          </div>
        )}

        {layout === "single" && (
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            {articles.slice(0, 2).map((a) => (
              <ArticleCard key={a.id} article={a} variant="medium" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
