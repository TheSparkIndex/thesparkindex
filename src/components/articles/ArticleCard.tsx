import Link from "next/link";
import type { ArticleWithRelations } from "@/lib/services/articles";
import { articleMinutes, byline, cardImage, primaryAuthor } from "@/lib/article";
import { formatDate } from "@/lib/utils";
import { SectionBadge } from "@/components/ui/SectionBadge";
import { Avatar } from "@/components/ui/Avatar";
import { ImageWithCaption } from "@/components/editorial/ImageWithCaption";
import { cn } from "@/lib/utils";

type CardVariant = "small" | "medium" | "large" | "featured" | "interview";

const layouts: Record<CardVariant, string> = {
  small: "",
  medium: "",
  large: "",
  featured: "md:grid-cols-2",
  interview: "md:grid-cols-2",
};

const titles: Record<CardVariant, string> = {
  small: "text-lg leading-tight font-extrabold tracking-tight group-hover:text-key-primary",
  medium: "text-xl leading-tight font-extrabold tracking-tight group-hover:text-key-primary",
  large: "text-2xl sm:text-3xl leading-tight font-black tracking-tight group-hover:text-key-primary",
  featured: "text-3xl sm:text-5xl leading-[1.02] font-black tracking-tight group-hover:text-key-primary",
  interview: "text-2xl sm:text-3xl leading-tight font-black tracking-tight group-hover:text-key-primary",
};

export function ArticleCard({
  article,
  variant = "medium",
  showExcerpt = true,
  className,
  priority,
}: {
  article: ArticleWithRelations;
  variant?: CardVariant;
  showExcerpt?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const img = cardImage(article, variant === "featured" || variant === "large" ? "hero" : "card");
  const author = primaryAuthor(article);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-card border border-key-border bg-key-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover",
        layouts[variant],
        className
      )}
    >
      <Link href={`/articulos/${article.slug}`} className={cn("block", variant !== "small" && layouts[variant])}>
        <ImageWithCaption
          src={img}
          alt={article.heroMedia?.altText ?? article.title}
          priority={priority}
          className={cn(
            variant === "featured" || variant === "large"
              ? "aspect-[16/10] md:aspect-auto md:h-full"
              : "aspect-[16/10]"
          )}
          imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <SectionBadge sectionSlug={article.section?.slug} color={article.section?.color} small>{article.section?.name}</SectionBadge>
        </div>

        <h3 className={titles[variant]}>
          <Link href={`/articulos/${article.slug}`} className="transition-colors">
            {article.title}
          </Link>
        </h3>

        {showExcerpt && article.excerpt && (
          <p className="line-clamp-3 text-sm leading-6 text-key-muted">{article.excerpt}</p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-key-muted">
          <Avatar
            src={author?.photo?.url}
            name={author?.name ?? "K"}
            size="sm"
            ringClassName="ring-1 ring-key-border"
          />
          <span className="font-semibold text-key-ink">{byline(article)}</span>
          <span aria-hidden>·</span>
          <time dateTime={article.publishedAt?.toISOString()}>{formatDate(article.publishedAt, { day: "2-digit", month: "short" })}</time>
          <span aria-hidden>·</span>
          <span>{articleMinutes(article)} min de lectura</span>
        </div>
      </div>
    </article>
  );
}
