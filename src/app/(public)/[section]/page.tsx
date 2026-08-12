import { notFound } from "next/navigation";
import { getSection, SECTIONS } from "@/lib/site";
import { getArticlesBySection, getFeaturedBySection } from "@/lib/services/articles";
import { SectionHeader } from "@/components/editorial/SectionHeader";
import { SectionBadge } from "@/components/ui/SectionBadge";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { ArticleGrid } from "@/components/articles/ArticleGrid";
import { Pagination } from "@/components/articles/Pagination";
import { EmptyState } from "@/components/editorial/EmptyState";

export async function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const meta = getSection(section);
  if (!meta) return {};
  return {
    title: meta.shortLabel,
    description: meta.description,
  };
}

export default async function SectionPage(props: { params: Promise<{ section: string }>; searchParams: Promise<{ page?: string }> }) {
  const { section } = await props.params;
  const searchParams = await props.searchParams;
  const meta = getSection(section);
  if (!meta) notFound();

  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const [featured, data] = await Promise.all([
    getFeaturedBySection(section),
    getArticlesBySection(section, { page, perPage: 12 }),
  ]);

  const hero = featured ?? data.items[0];
  const gridItems = data.items.filter((a) => a.id !== hero?.id);

  return (
    <>
      <SectionHeader sectionSlug={section} count={data.total} />

      {hero && (
        <section className="container-key py-10">
          <div className="mb-6">
            <SectionBadge sectionSlug={section} small />
          </div>
          <ArticleCard article={hero} variant="featured" className="grid-cols-1" priority />
        </section>
      )}

      <section className="container-key py-4 pb-16">
        <h2 className="display mb-6 text-2xl sm:text-3xl">Más historias</h2>
        {gridItems.length > 0 ? (
          <>
            <ArticleGrid articles={gridItems} />
            <Pagination page={data.page} pages={data.pages} baseHref={`/${section}`} className="mt-12" />
          </>
        ) : (
          <EmptyState
            title={data.items.length ? "Ya viste todo lo que hay." : "No hay historias aquí todavía."}
            message={data.items.length ? "Vuelve pronto, estamos preparando algo nuevo." : "Estamos preparando algo nuevo para esta sección."}
          />
        )}
      </section>
    </>
  );
}
