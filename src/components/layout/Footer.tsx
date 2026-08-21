import Link from "next/link";
import { Logo } from "./Logo";
import type { SectionMeta } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { NewsletterSubscribe } from "@/components/public/NewsletterSubscribe";

export function Footer({ sections }: { sections: SectionMeta[] }) {
  return (
    <footer className="mt-auto border-t-2 border-key-ink bg-key-ink text-key-white">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
              Revista digital hecha por y para la comunidad de Key Institute.
              Estudiantes que no solo estudian el futuro: lo crean, lo cuestionan
              y cuentan sus historias.
            </p>
          </div>

          <nav aria-label="Secciones">
            <h3 className="kicker mb-4 text-key-primary">Secciones</h3>
            <ul className="space-y-2 text-sm">
              {sections.map((s) => (
                <li key={s.slug}>
                  <Link href={`/${s.slug}`} className="text-white/80 transition-colors hover:text-key-primary">
                    {s.shortLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="kicker mb-4 text-key-primary">La revista</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/autores" className="text-white/80 transition-colors hover:text-key-primary">
                  Nuestros autores
                </Link>
              </li>
              <li>
                <Link href="/buscar" className="text-white/80 transition-colors hover:text-key-primary">
                  Buscar
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-white/50 transition-colors hover:text-key-primary">
                  Acceso editorial
                </Link>
              </li>
            </ul>
            <p className="mt-6 text-xs leading-5 text-white/50">
              Las opiniones publicadas pertenecen a sus autores y no representan
              necesariamente la posición oficial de Key Institute.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/15 pt-8">
          <NewsletterSubscribe compact />
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/15 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Key Institute · KEY — The Spark Index</p>
        </div>
      </Container>
    </footer>
  );
}
