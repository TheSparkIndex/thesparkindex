import Link from "next/link";
import type { ArticleWithRelations } from "@/lib/services/articles";
import { ArticleCard } from "./ArticleCard";

export function RelatedArticles({
  articles,
  title = "Historias relacionadas",
}: {
  articles: ArticleWithRelations[];
  title?: string;
}) {
  if (!articles.length) return null;
  return (
    <section className="mt-16">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-1 w-10 rounded-full bg-key-primary" aria-hidden />
        <h2 className="display text-2xl sm:text-3xl">{title}</h2>
      </div>
      <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} variant="medium" />
        ))}
      </div>
    </section>
  );
}

export function MoreFromAuthor({
  articles,
  authorSlug,
  authorName,
}: {
  articles: ArticleWithRelations[];
  authorSlug: string;
  authorName: string;
}) {
  if (!articles.length) return null;
  return (
    <section className="mt-16">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-1 w-10 rounded-full bg-key-orange" aria-hidden />
          <h2 className="display text-2xl sm:text-3xl">Más de {authorName}</h2>
        </div>
        <Link href={`/autores/${authorSlug}`} className="text-sm font-bold text-key-primary hover:underline">
          Ver perfil
        </Link>
      </div>
      <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} variant="medium" />
        ))}
      </div>
    </section>
  );
}
