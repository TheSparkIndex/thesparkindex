import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthorBySlug, getActiveAuthors } from "@/lib/services/authors";
import { getArticlesByAuthor } from "@/lib/services/articles";
import { SITE } from "@/lib/site";
import { ArticleGrid } from "@/components/articles/ArticleGrid";
import { Pagination } from "@/components/articles/Pagination";
import { EmptyState } from "@/components/editorial/EmptyState";
import { Avatar } from "@/components/ui/Avatar";

export async function generateStaticParams() {
  const authors = await getActiveAuthors();
  return authors.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return {};
  return {
    title: author.name,
    description: author.bio?.slice(0, 160) ?? `Perfil de ${author.name} en ${SITE.name}.`,
    openGraph: {
      title: author.name,
      type: "profile",
      url: `${SITE.url}/autores/${author.slug}`,
      images: author.photo?.url ? [{ url: `${SITE.url}${author.photo.url}` }] : undefined,
    },
  };
}

export default async function AuthorPage(props: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const data = await getArticlesByAuthor(author.slug, { page, perPage: 9 });
  const social = (author.socialLinks ?? {}) as Record<string, string | null>;

  const socials = [
    { label: "Instagram", short: "IG", href: social.instagram },
    { label: "LinkedIn", short: "in", href: social.linkedin },
    { label: "GitHub", short: "GH", href: social.github },
    { label: "X / Twitter", short: "X", href: social.twitter },
  ].filter((s) => s.href);

  return (
    <>
      <section className="relative overflow-hidden bg-key-primary text-white">
        <div className="bg-dotgrid-ink absolute inset-0 opacity-40" aria-hidden />
        <div className="container-key relative flex flex-col items-start gap-6 py-12 sm:flex-row sm:items-center sm:py-16">
          <Avatar
            src={author.photo?.url}
            name={author.name}
            alt={`Foto de ${author.name}`}
            size="xxl"
            className="bg-key-lime text-key-ink"
            ringClassName="ring-4 ring-white/30"
          />
          <div>
            <span className="hand block -rotate-2 text-2xl text-key-lime">conoce a</span>
            <h1 className="display text-4xl sm:text-5xl">{author.name}</h1>
            <p className="mt-1 text-white/80">
              {[author.role, author.program].filter(Boolean).join(" · ") || "Colaborador de KEY"}
            </p>
            {socials.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="grid h-9 min-w-9 items-center justify-center rounded-full bg-white/15 px-2 text-xs font-bold text-white transition-colors hover:bg-white/30"
                  >
                    {s.short}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container-key py-12 sm:py-16">
        {author.bio && (
          <p className="mb-12 max-w-2xl border-l-4 border-key-lime-dark pl-5 text-lg leading-8 text-key-muted">
            {author.bio}
          </p>
        )}

        <h2 className="display mb-6 text-2xl sm:text-3xl">Historias de {author.name}</h2>
        {data.items.length ? (
          <>
            <ArticleGrid articles={data.items} />
            <Pagination page={data.page} pages={data.pages} baseHref={`/autores/${author.slug}`} className="mt-12" />
          </>
        ) : (
          <EmptyState title="Aún no hay historias publicadas." message="Este autor está preparando su primera historia." />
        )}
      </section>
    </>
  );
}
