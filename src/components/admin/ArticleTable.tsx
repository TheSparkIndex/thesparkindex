"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Edit, Star, ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { deleteArticle, setArticleStatus, toggleFeature } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";
import { ConfirmButton } from "./ui";

export type AdminArticleRow = {
  id: string;
  title: string;
  status: "draft" | "scheduled" | "published" | "archived";
  featured: boolean;
  updatedAt: Date;
  publishedAt: Date | null;
  section?: { name: string; slug: string } | null;
  authors?: Array<{ author: { name: string; slug: string } }>;
  heroMedia?: { url: string; variants?: Record<string, { url: string }> | null } | null;
};

const STATUS_LABEL: Record<string, string> = {
  published: "Publicado",
  draft: "Borrador",
  scheduled: "Programado",
  archived: "Archivado",
};

const STATUS_STYLE: Record<string, string> = {
  published: "bg-key-primary-soft text-key-primary",
  draft: "bg-key-muted-soft text-key-muted",
  scheduled: "bg-key-orange-soft text-key-orange",
  archived: "bg-key-ink-soft text-key-muted",
};

export function ArticleTable({ rows, showSection = true }: { rows: AdminArticleRow[]; showSection?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ error?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      if (result?.error) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  };

  const formatDate = (d: Date | null) =>
    d ? new Intl.DateTimeFormat("es-SV", { dateStyle: "short" }).format(d) : "—";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-b border-key-border text-xs font-black uppercase tracking-wide text-key-muted">
            <th className="px-4 py-3">Artículo</th>
            <th className="px-4 py-3">Sección</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Actualizado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-key-border">
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-key-muted">
                No hay artículos que coincidan.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className={cn("text-sm", pending ? "opacity-60" : "hover:bg-key-surface-alt")}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-key-surface-alt">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.heroMedia?.variants?.thumb?.url ?? row.heroMedia?.url ?? ""}
                      alt=""
                      className={row.heroMedia ? "size-full object-cover" : "hidden"}
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/admin/articulos/${row.id}`} className="font-bold text-key-ink hover:text-key-primary">
                      {row.title}
                    </Link>
                    <div className="flex items-center gap-1.5">
                      {row.authors?.map((a) => a.author.name).join(", ") ? (
                        <span className="truncate text-xs text-key-muted">{row.authors.map((a) => a.author.name).join(", ")}</span>
                      ) : (
                        <span className="text-xs text-key-muted">Sin autores</span>
                      )}
                      {row.featured ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-key-lime px-2 py-0.5 text-[10px] font-black uppercase text-key-ink">
                          <Star className="size-3" /> Destacado
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                {showSection && row.section ? (
                  <span className="rounded-full bg-key-surface-alt px-2.5 py-1 text-xs font-bold text-key-ink">{row.section.name}</span>
                ) : (
                  <span className="text-xs text-key-muted">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-black uppercase", STATUS_STYLE[row.status])}>
                  {STATUS_LABEL[row.status]}
                </span>
                {row.status === "scheduled" && (
                  <div className="mt-1 text-[11px] text-key-muted">{formatDate(row.publishedAt)}</div>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-key-muted">{formatDate(row.updatedAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                  {row.status === "draft" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => setArticleStatus(row.id, "published"))}
                      title="Publicar"
                      aria-label="Publicar"
                      className="grid size-7 place-items-center rounded-md bg-key-primary text-white hover:bg-key-primary-dark disabled:opacity-50"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                  ) : row.status === "published" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => setArticleStatus(row.id, "draft"))}
                      title="Despublicar"
                      aria-label="Despublicar"
                      className="grid size-7 place-items-center rounded-md bg-key-surface-alt text-key-muted hover:bg-key-muted-soft hover:text-key-ink disabled:opacity-50"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => toggleFeature(row.id, !row.featured))}
                    title={row.featured ? "Quitar destacado" : "Destacar"}
                    aria-label={row.featured ? "Quitar destacado" : "Destacar"}
                    className={cn(
                      "grid size-7 place-items-center rounded-md transition-colors disabled:opacity-50",
                      row.featured ? "bg-key-lime text-key-ink" : "bg-key-surface-alt text-key-muted hover:text-key-ink"
                    )}
                  >
                    <Star className="size-4" fill={row.featured ? "currentColor" : "none"} />
                  </button>
                  <Link
                    href={`/admin/articulos/${row.id}`}
                    className="grid size-7 place-items-center rounded-md bg-key-surface-alt text-key-muted hover:bg-key-primary-soft hover:text-key-ink"
                    aria-label={`Editar ${row.title}`}
                  >
                    <Edit className="size-3.5" />
                  </Link>
                  <ConfirmButton
                    title="Eliminar"
                    onConfirm={async () => {
                      await deleteArticle(row.id);
                      router.refresh();
                    }}
                  >
                    <Trash2 className="size-4" />
                  </ConfirmButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
