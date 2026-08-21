import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

type Props = {
  title: string;
  subtitle?: string | null;
  articleSlug?: string | null;
};

export function HomeBanner({ title, subtitle, articleSlug }: Props) {
  return (
    <section className="bg-key-primary text-white">
      <Container className="flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="display text-xl sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-white/80">{subtitle}</p>}
        </div>
        {articleSlug && (
          <Link
            href={`/articulos/${articleSlug}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-key-lime px-6 py-2.5 text-sm font-bold text-key-ink transition-all hover:gap-3 hover:brightness-95"
          >
            Leer más <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </Container>
    </section>
  );
}
