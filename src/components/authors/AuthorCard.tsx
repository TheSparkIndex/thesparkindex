import Link from "next/link";
import type { AuthorWithRelations } from "@/lib/services/authors";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export function AuthorCard({ author, className }: { author: AuthorWithRelations; className?: string }) {
  return (
    <Link
      href={`/autores/${author.slug}`}
      className={cn(
        "group flex items-center gap-4 rounded-card border border-key-border bg-key-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover",
        className
      )}
    >
      <Avatar
        src={author.photo?.url}
        name={author.name}
        alt={`Foto de ${author.name}`}
        size="xl"
        ringClassName="ring-2 ring-key-primary/30 transition-transform group-hover:scale-105"
      />
      <span className="min-w-0">
        <span className="block truncate text-lg font-extrabold text-key-ink group-hover:text-key-primary">
          {author.name}
        </span>
        <span className="block truncate text-sm text-key-muted">
          {[author.role, author.program].filter(Boolean).join(" · ") || "Colaborador de KEY"}
        </span>
      </span>
    </Link>
  );
}
