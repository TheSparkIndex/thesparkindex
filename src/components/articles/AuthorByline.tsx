import Link from "next/link";
import type { ArticleWithRelations } from "@/lib/services/articles";
import { ContributorRole } from "@/generated/prisma/client";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<ContributorRole, string> = {
  author: "",
  collaborator: "Con la colaboración de",
  photographer: "Fotografía de",
  editor: "Edición de",
};

function PersonLink({ author }: { author: { slug: string; name: string; role?: string | null; photo?: { url: string | null } | null } }) {
  return (
    <Link href={`/autores/${author.slug}`} className="group inline-flex items-center gap-2.5">
      <Avatar
        src={author.photo?.url}
        name={author.name}
        size="lg"
        ringClassName="ring-2 ring-key-border transition-transform group-hover:scale-105"
      />
      <span>
        <span className="block font-bold leading-tight text-key-ink group-hover:text-key-primary">{author.name}</span>
        {author.role && <span className="block text-xs text-key-muted">{author.role}</span>}
      </span>
    </Link>
  );
}

export function AuthorByline({
  article,
  className,
}: {
  article: ArticleWithRelations;
  className?: string;
}) {
  const rows = [...(article.authors ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-4", className)}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {rows.map((row) => {
          const label = ROLE_LABEL[row.role];
          return (
            <div key={row.authorId} className="flex items-center gap-2">
              {label && <span className="kicker text-key-muted">{label}</span>}
              <PersonLink author={row.author} />
            </div>
          );
        })}
      </div>
      <div className="text-xs text-key-muted">
        <p>
          Publicado{" "}
          <time dateTime={article.publishedAt?.toISOString()}>
            {formatDate(article.publishedAt)}
          </time>
        </p>
        {article.updatedAt.getTime() !== article.publishedAt?.getTime() && (
          <p>
            Actualizado <time dateTime={article.updatedAt.toISOString()}>{formatDate(article.updatedAt)}</time>
          </p>
        )}
      </div>
    </div>
  );
}
