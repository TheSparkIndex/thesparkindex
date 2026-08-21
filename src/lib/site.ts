export const SITE = {
  name: process.env.SITE_NAME ?? "KEY — The Spark Index",
  url: process.env.SITE_URL ?? "http://localhost:3000",
  tagline: "La revista hecha por y para la comunidad de Key.",
};

export type SectionMeta = {
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  colorVar: string;
};

export const DEFAULT_SECTIONS: SectionMeta[] = [
  {
    slug: "noticias",
    label: "Noticias",
    shortLabel: "Noticias",
    description:
      "Lo que está pasando en Key: campus, eventos, logros, proyectos y todo lo que mueve a la comunidad.",
    color: "#026DFD",
    colorVar: "var(--color-sec-noticias)",
  },
  {
    slug: "opinion",
    label: "Opinión",
    shortLabel: "Opinión",
    description:
      "Columnas, ensayos, debates y reflexiones. Las opiniones pertenecen a sus autores y no representan necesariamente la posición oficial de Key Institute.",
    color: "#FF5A1F",
    colorVar: "var(--color-sec-opinion)",
  },
  {
    slug: "entrevistas",
    label: "Entrevistas a Staff",
    shortLabel: "Entrevistas",
    description:
      "Charlas con profesores, directores, investigadores y mentores que construyen Key todos los días.",
    color: "#4F46E5",
    colorVar: "var(--color-sec-entrevistas)",
  },
  {
    slug: "ciencia-ingenieria",
    label: "Divulgación sobre Ciencia e Ingeniería",
    shortLabel: "Ciencia & Ingeniería",
    description:
      "Ciencia e ingeniería explicadas para todos: IA, robótica, energía, matemática, física y más.",
    color: "#0D9488",
    colorVar: "var(--color-sec-ciencia)",
  },
  {
    slug: "valores-key",
    label: "Valores Key",
    shortLabel: "Valores Key",
    description:
      "Historias de cultura, comunidad, liderazgo, colaboración y experiencia estudiantil en Key.",
    color: "#5E9400",
    colorVar: "var(--color-sec-valores)",
  },
];

export function getSection(slug: string): SectionMeta | undefined {
  return DEFAULT_SECTIONS.find((s) => s.slug === slug);
}
