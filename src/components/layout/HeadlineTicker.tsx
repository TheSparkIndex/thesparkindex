import Link from "next/link";
import type { ArticleWithRelations } from "@/lib/services/articles";
import { byline } from "@/lib/article";

export function HeadlineTicker({ articles }: { articles: ArticleWithRelations[] }) {
  if (!articles.length) return null;
  const items = articles.slice(0, 8);
  const doubled = [...items, ...items];
  return (
    <div
      className="relative overflow-hidden border-y border-key-border bg-key-primary py-2 text-white"
      role="region"
      aria-label="Últimas historias"
    >
      <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap pr-8">
        {doubled.map((a, i) => (
          <Link
            key={`${a.id}-${i}`}
            href={`/articulos/${a.slug}`}
            className="flex items-center gap-2 text-sm font-semibold hover:underline"
          >
            <span className="size-1.5 rounded-full bg-key-lime" aria-hidden />
            {a.title}
            <span className="text-white/60">· {byline(a)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
