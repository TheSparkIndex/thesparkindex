import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ArticleWithRelations } from "@/lib/services/articles";
import { articleMinutes, byline, cardImage, primaryAuthor } from "@/lib/article";
import { formatDate } from "@/lib/utils";
import { SectionBadge } from "@/components/ui/SectionBadge";
import { Avatar } from "@/components/ui/Avatar";
import { ImageWithCaption } from "@/components/editorial/ImageWithCaption";

export function ArticleHero({ article }: { article: ArticleWithRelations }) {
  const img = cardImage(article, "hero");
  const author = primaryAuthor(article);

  return (
    <section className="relative overflow-hidden bg-key-ink text-white">
      <div className="absolute inset-0 bg-dotgrid-ink opacity-40" aria-hidden />
      <div className="container-key relative grid gap-0 md:grid-cols-[1.3fr_1fr]">
        <div className="relative">
          <ImageWithCaption
            src={img}
            alt={article.heroMedia?.altText ?? article.title}
            aspect="aspect-[16/10] md:aspect-[16/11] md:h-full"
            priority
          />
        </div>

        <div className="flex flex-col justify-center gap-5 bg-key-primary p-6 sm:p-10 lg:p-12">
          <SectionBadge sectionSlug={article.section?.slug} className="self-start" />
          <h1 className="display text-3xl text-white sm:text-4xl lg:text-5xl text-balance">
            <Link href={`/articulos/${article.slug}`} className="hover:underline decoration-key-lime decoration-4 underline-offset-4">
              {article.title}
            </Link>
          </h1>
          {article.excerpt && <p className="text-base leading-7 text-white/85">{article.excerpt}</p>}

          <div className="flex items-center gap-2 text-sm text-white/80">
            {author && (
              <Avatar
                src={author.photo?.url}
                name={author.name}
                size="md"
                ringClassName="ring-2 ring-white/40"
              />
            )}
            <span className="font-bold">{byline(article)}</span>
            <span aria-hidden>·</span>
            <time dateTime={article.publishedAt?.toISOString()}>{formatDate(article.publishedAt)}</time>
            <span aria-hidden>·</span>
            <span>{articleMinutes(article)} min</span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <Link
              href={`/articulos/${article.slug}`}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-key-lime px-7 text-base font-bold text-key-ink transition-all hover:gap-3 hover:brightness-95"
            >
              Leer historia <ArrowRight className="size-4" aria-hidden />
            </Link>
            <span className="hand rotate-[-4deg] text-2xl text-key-lime" aria-hidden>
              ¡esta es la buena!
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
