import type { Metadata } from "next";
import { searchArticles } from "@/lib/services/articles";
import { getActiveAuthors } from "@/lib/services/authors";
import { SearchForm } from "@/components/search/SearchForm";
import { ArticleGrid } from "@/components/articles/ArticleGrid";
import { Pagination } from "@/components/articles/Pagination";
import { EmptyState } from "@/components/editorial/EmptyState";

export const metadata: Metadata = {
  title: "Buscar",
  description: "Busca historias, autores y temas en KEY — The Spark Index.",
};

type SearchParams = { q?: string; section?: string; author?: string; page?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const section = sp.section ?? "";
  const author = sp.author ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const [authors, results] = await Promise.all([
    getActiveAuthors(),
    searchArticles(
      q,
      { page, perPage: 12 },
      { section: section || undefined, author: author || undefined }
    ),
  ]);

  return (
    <section className="container-key py-12 sm:py-16">
      <span className="hand block -rotate-2 text-2xl text-key-primary">encuentra lo que buscas</span>
      <h1 className="display text-4xl sm:text-5xl">Buscar</h1>

      <div className="mt-8 max-w-2xl">
        <SearchForm authors={authors} currentAuthor={author || undefined} />
      </div>

      <div className="mt-10">
        {q ? (
          <p className="mb-6 text-key-muted">
            <strong className="text-key-ink">{results.total}</strong>{" "}
            {results.total === 1 ? "resultado" : "resultados"} para{" "}
            <strong className="marker-lime">“{q}”</strong>
          </p>
        ) : results.total > 0 ? (
          <p className="mb-6 text-key-muted">
            <strong className="text-key-ink">{results.total}</strong>{" "}
            {results.total === 1 ? "historia" : "historias"} publicadas
          </p>
        ) : null}

        {results.items.length ? (
          <>
            <ArticleGrid articles={results.items} />
            <Pagination
              page={results.page}
              pages={results.pages}
              baseHref="/buscar"
              query={{ ...(q ? { q } : {}), ...(section ? { section } : {}), ...(author ? { author } : {}) }}
              className="mt-12"
            />
          </>
        ) : (
          <EmptyState
            title="Sin resultados"
            message={q ? `No encontramos nada para “${q}”. Prueba con otras palabras o quita los filtros.` : "No hay historias todavía."}
          />
        )}
      </div>
    </section>
  );
}
