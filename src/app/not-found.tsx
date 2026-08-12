import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/editorial/EmptyState";

export default function NotFound() {
  return (
    <section className="container-key flex flex-1 items-center py-20">
      <div className="w-full">
        <EmptyState
          title="404 — Esta página se perdió en el laboratorio."
          message="La historia que buscas no existe o fue movida. Pero hay muchas más por descubrir."
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-full bg-key-primary px-5 text-sm font-bold text-white hover:bg-key-primary-dark">
              <Compass className="size-4" aria-hidden /> Ir al inicio
            </Link>
            <Link href="/buscar" className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-key-ink px-5 text-sm font-bold text-key-ink hover:bg-key-ink hover:text-white">
              Buscar historias
            </Link>
          </div>
        </EmptyState>
      </div>
    </section>
  );
}
