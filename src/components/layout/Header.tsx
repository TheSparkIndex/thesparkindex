"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import type { SectionMeta } from "@/lib/site";

export function Header({ sections }: { sections: SectionMeta[] }) {
  const NAV = sections.map((s) => ({
    label: s.shortLabel,
    href: `/${s.slug}`,
    color: s.color,
  }));

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    window.location.href = q ? `/buscar?q=${encodeURIComponent(q)}` : "/buscar";
  }

  return (
    <header className="sticky top-0 z-40 border-b-2 border-key-ink bg-key-white/95 backdrop-blur">
      <div className="container-key flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Secciones">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-3 py-1.5 text-sm font-bold transition-colors hover:bg-key-surface-alt",
                  active ? "text-key-primary" : "text-key-ink"
                )}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute -bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={searchOpen ? "Cerrar búsqueda" : "Buscar"}
            aria-expanded={searchOpen}
            className="grid size-9 place-items-center rounded-full text-key-ink transition-colors hover:bg-key-surface-alt"
          >
            {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            className="grid size-9 place-items-center rounded-full text-key-ink transition-colors hover:bg-key-surface-alt lg:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-key-border bg-key-white">
          <form onSubmit={submitSearch} className="container-key flex items-center gap-3 py-3" role="search">
            <Search className="size-5 shrink-0 text-key-primary" aria-hidden />
            <label htmlFor="header-search" className="sr-only">
              Buscar en la revista
            </label>
            <input
              id="header-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca historias, autores, temas…"
              className="w-full bg-transparent text-lg outline-none placeholder:text-key-muted"
              autoFocus
            />
            <button type="submit" className="shrink-0 rounded-full bg-key-ink px-4 py-1.5 text-sm font-bold text-white hover:bg-black">
              Buscar
            </button>
          </form>
        </div>
      )}

      {menuOpen && (
        <nav className="border-t border-key-border bg-key-white lg:hidden" aria-label="Menú móvil">
          <ul className="container-key divide-y divide-key-border py-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-3 text-base font-bold"
                  style={{ color: item.color }}
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/buscar"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 py-3 text-base font-bold text-key-ink"
              >
                <Search className="size-4" aria-hidden /> Buscar
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
