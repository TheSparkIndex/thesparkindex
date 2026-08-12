import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Info } from "lucide-react";
import { getArticleBySlug, getRelatedArticles, getArticlesByAuthor } from "@/lib/services/articles";
import { primaryAuthor, articleMinutes, cardImage, byline } from "@/lib/article";
import { SITE, getSection } from "@/lib/site";
import { ArticleBody } from "@/components/articles/ArticleBody";
import { AuthorByline } from "@/components/articles/AuthorByline";
import { ShareButtons } from "@/components/articles/ShareButtons";
import { RelatedArticles, MoreFromAuthor } from "@/components/articles/RelatedArticles";
import { ImageWithCaption } from "@/components/editorial/ImageWithCaption";
import { SectionBadge } from "@/components/ui/SectionBadge";

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const title = article.seoTitle || article.title;
  const description = article.seoDescription || article.excerpt || article.subtitle || undefined;
  const img = cardImage(article, "og");

  return {
    title,
    description,
    alternates: { canonical: `${SITE.url}/articulos/${article.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE.url}/articulos/${article.slug}`,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: article.authors.map((a) => a.author.name),
      section: article.section?.name ?? undefined,
      tags: article.tags.map((t) => t.name),
      images: img ? [{ url: `${SITE.url}${img}`, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: img ? [`${SITE.url}${img}`] : undefined,
    },
  };
}

function articleJsonLd(article: NonNullable<Awaited<ReturnType<typeof getArticleBySlug>>>) {
  const img = cardImage(article, "og");
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt || undefined,
    image: img ? [`${SITE.url}${img}`] : undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: article.authors.map((a) => ({
      "@type": "Person",
      name: a.author.name,
      url: `${SITE.url}/autores/${a.author.slug}`,
    })),
    publisher: {
      "@type": "Organization",
      name: "Key Institute",
    },
    mainEntityOfPage: `${SITE.url}/articulos/${article.slug}`,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const primary = primaryAuthor(article);
  const [related, moreFromAuthor] = await Promise.all([
    getRelatedArticles(article, 3),
    primary ? getArticlesByAuthor(primary.slug, { perPage: 3 }) : Promise.resolve({ items: [] }),
  ]);

  const heroImg = cardImage(article, "hero") ?? cardImage(article, "wide");
  const sectionMeta = article.section ? getSection(article.section.slug) : undefined;
  const jsonLd = articleJsonLd(article);
  const breadcrumb = [
    { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE.url}/` },
    ...(article.section
      ? [{ "@type": "ListItem", position: 2, name: article.section.name, item: `${SITE.url}/${article.section.slug}` }]
      : []),
    { "@type": "ListItem", position: article.section ? 3 : 2, name: article.title, item: `${SITE.url}/articulos/${article.slug}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: breadcrumb,
          }),
        }}
      />

      <article className="container-key max-w-3xl py-10 sm:py-14">
        <nav aria-label="Ruta de navegación" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-key-muted">
          <Link href="/" className="hover:text-key-primary">Inicio</Link>
          <ChevronRight className="size-3" aria-hidden />
          {article.section && (
            <>
              <Link href={`/${article.section.slug}`} className="hover:text-key-primary">
                {sectionMeta?.shortLabel ?? article.section.name}
              </Link>
              <ChevronRight className="size-3" aria-hidden />
            </>
          )}
          <span className="truncate font-semibold text-key-ink">{article.title}</span>
        </nav>

        <header>
          <SectionBadge sectionSlug={article.section?.slug} />
          <h1 className="display mt-4 text-3xl sm:text-5xl text-balance">{article.title}</h1>
          {article.subtitle && <p className="mt-4 text-lg leading-7 text-key-muted sm:text-xl">{article.subtitle}</p>}

          <div className="mt-6 flex flex-col gap-4 border-y border-key-border py-5 sm:flex-row sm:items-center sm:justify-between">
            <AuthorByline article={article} />
            <ShareButtons slug={article.slug} title={article.title} />
          </div>

          <p className="mt-4 text-sm text-key-muted">
            Lectura de {articleMinutes(article)} minutos
            {article.tags.length > 0 && (
              <span className="mt-1 flex flex-wrap gap-2">
                {article.tags.map((t) => (
                  <span key={t.id} className="rounded-full bg-key-surface-alt px-2.5 py-0.5 text-xs font-semibold">
                    #{t.name}
                  </span>
                ))}
              </span>
            )}
          </p>
        </header>

        {heroImg && (
          <figure className="mt-8">
            <ImageWithCaption
              src={heroImg}
              alt={article.heroMedia?.altText ?? article.title}
              aspect="aspect-[16/9]"
              priority
            />
          </figure>
        )}

        {article.section?.slug === "opinion" && (
          <aside className="mt-8 flex items-start gap-3 rounded-card border border-key-orange/40 bg-key-orange/10 p-4 text-sm leading-6 text-key-ink">
            <Info className="mt-0.5 size-4 shrink-0 text-key-orange" aria-hidden />
            <p>
              Las opiniones expresadas pertenecen a su autor y no representan
              necesariamente la posición oficial de Key Institute.
            </p>
          </aside>
        )}

        <div className="mt-10">
          <ArticleBody content={article.content} />
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-key-border pt-6">
          <p className="text-xs text-key-muted">
            {byline(article)} · {SITE.name}
          </p>
          <ShareButtons slug={article.slug} title={article.title} />
        </div>
      </article>

      <div className="container-key pb-16">
        <MoreFromAuthor
          articles={moreFromAuthor.items.filter((a) => a.id !== article.id).slice(0, 3)}
          authorSlug={primary?.slug ?? ""}
          authorName={primary?.name ?? "este autor"}
        />
        <RelatedArticles articles={related} />
      </div>
    </>
  );
}
