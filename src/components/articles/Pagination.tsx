import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  pages: number;
  baseHref: string;
  query?: Record<string, string>;
  className?: string;
};

export function Pagination({ page, pages, baseHref, query = {}, className }: Props) {
  if (pages <= 1) return null;
  const qs = new URLSearchParams(query);

  const href = (p: number) => {
    const s = new URLSearchParams(qs);
    if (p > 1) s.set("page", String(p));
    else s.delete("page");
    const q = s.toString();
    return q ? `${baseHref}?${q}` : baseHref;
  };

  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 1
  );

  return (
    <nav aria-label="Paginación" className={cn("flex items-center justify-center gap-1.5", className)}>
      <Link
        href={href(page - 1)}
        aria-disabled={page <= 1}
        className={cn(
          "grid size-10 place-items-center rounded-full border-2 border-key-border font-bold transition-colors",
          page <= 1 ? "pointer-events-none opacity-40" : "hover:border-key-ink"
        )}
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </Link>
      {numbers.map((p, i) => {
        const prev = numbers[i - 1];
        const gap = prev && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && <span className="px-1 text-key-muted">…</span>}
            <Link
              href={href(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "grid size-10 place-items-center rounded-full text-sm font-bold transition-colors",
                p === page ? "bg-key-ink text-white" : "border-2 border-key-border hover:border-key-ink"
              )}
            >
              {p}
            </Link>
          </span>
        );
      })}
      <Link
        href={href(page + 1)}
        aria-disabled={page >= pages}
        className={cn(
          "grid size-10 place-items-center rounded-full border-2 border-key-border font-bold transition-colors",
          page >= pages ? "pointer-events-none opacity-40" : "hover:border-key-ink"
        )}
        aria-label="Página siguiente"
      >
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </nav>
  );
}
