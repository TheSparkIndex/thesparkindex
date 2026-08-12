import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!input) return "";
  const date = new Date(input);
  return new Intl.DateTimeFormat("es-SV", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  }).format(date);
}

export function readingTime(content: unknown): number {
  if (!content) return 1;
  const text =
    typeof content === "string"
      ? content
      : JSON.stringify(content)
          .replace(/[{}"\[\]]/g, " ")
          .replace(/\s+/g, " ");
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
