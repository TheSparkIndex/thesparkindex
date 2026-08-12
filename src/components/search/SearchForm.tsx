"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { SECTIONS as SITE_SECTIONS } from "@/lib/site";

const SECTIONS = [
  { slug: "", label: "Todas las secciones" },
  ...SITE_SECTIONS.map((s) => ({ slug: s.slug, label: s.shortLabel })),
];

export function SearchForm({
  authors,
  currentAuthor,
}: {
  authors: Array<{ slug: string; name: string }>;
  currentAuthor?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [section, setSection] = useState(params.get("section") ?? "");
  const [author, setAuthor] = useState(currentAuthor ?? params.get("author") ?? "");
  const [, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (section) next.set("section", section);
    if (author) next.set("author", author);
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `/buscar?${qs}` : "/buscar");
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" role="search" aria-label="Buscar en la revista">
      <div className="flex items-center gap-3 rounded-full border-2 border-key-ink bg-key-surface px-4 focus-within:ring-2 focus-within:ring-key-primary">
        <Search className="size-5 shrink-0 text-key-primary" aria-hidden />
        <label htmlFor="search-q" className="sr-only">Buscar</label>
        <input
          id="search-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca historias, autores, temas…"
          className="h-12 w-full bg-transparent text-base outline-none placeholder:text-key-muted"
        />
        <button type="submit" className="shrink-0 rounded-full bg-key-ink px-5 py-1.5 text-sm font-bold text-white hover:bg-black">
          Buscar
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 rounded-full border-2 border-key-border px-3 py-1.5 text-sm font-semibold">
          <span className="sr-only">Sección</span>
          <select value={section} onChange={(e) => setSection(e.target.value)} className="bg-transparent outline-none">
            {SECTIONS.map((s) => (
              <option key={s.slug} value={s.slug}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-full border-2 border-key-border px-3 py-1.5 text-sm font-semibold">
          <span className="sr-only">Autor</span>
          <select value={author} onChange={(e) => setAuthor(e.target.value)} className="bg-transparent outline-none">
            <option value="">Todos los autores</option>
            {authors.map((a) => (
              <option key={a.slug} value={a.slug}>{a.name}</option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}
