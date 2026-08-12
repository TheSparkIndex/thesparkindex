"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, UploadCloud, X, Check } from "lucide-react";
import { deleteMedia, updateMediaMeta } from "@/lib/actions/admin";
import { useMediaLibrary } from "./useMediaLibrary";
import { ConfirmButton } from "./ui";

export type MediaRow = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  credit: string | null;
  description: string | null;
  createdAt: Date;
  variants?: Record<string, { url: string }> | null;
};

export function MediaLibrary({ initial }: { initial: MediaRow[] }) {
  const router = useRouter();
  const { items, setItems, uploading, error, setError, q, setQ, load, upload } = useMediaLibrary({
    initial,
    take: 120,
    onUpload: () => router.refresh(),
  });
  const [selected, setSelected] = useState<MediaRow | null>(null);
  const [editing, setEditing] = useState<MediaRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = q ? items.filter((m) => m.filename.toLowerCase().includes(q.toLowerCase())) : items;

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-key-orange/10 px-4 py-2.5 text-sm font-semibold text-key-orange">{error}</p>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-key-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre…"
            className="h-11 w-full rounded-lg border-2 border-key-border bg-key-white pl-9 pr-3 text-sm outline-none focus:border-key-primary"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            files.forEach(upload);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-key-primary px-5 font-bold text-white hover:bg-key-primary-dark disabled:opacity-60"
        >
          <UploadCloud className="size-4" /> {uploading ? "Subiendo…" : "Subir imágenes"}
        </button>
      </div>

      {selected ? (
        <div className="mb-6 grid gap-6 rounded-2xl border border-key-border bg-key-white p-5 shadow-sm md:grid-cols-[320px_1fr]">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-key-ink">
            <Image
              src={selected.variants?.hero?.url ?? selected.url}
              alt={selected.altText ?? selected.filename}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-key-ink">{selected.filename}</h3>
                <p className="text-xs text-key-muted">
                  {selected.mimeType} · {selected.width && selected.height ? `${selected.width}×${selected.height}` : "sin dimensiones"} ·{" "}
                  {selected.createdAt.toLocaleDateString("es-SV")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Cerrar detalle"
                className="grid size-9 place-items-center rounded-lg text-key-muted hover:bg-key-surface-alt"
              >
                <X className="size-5" />
              </button>
            </div>

            {editing?.id === selected.id ? (
              <form
                className="mt-4 space-y-3"
                action={async (formData) => {
                  const meta = {
                    altText: (formData.get("altText") as string) || null,
                    caption: (formData.get("caption") as string) || null,
                    credit: (formData.get("credit") as string) || null,
                    description: (formData.get("description") as string) || null,
                  };
                  const res = await updateMediaMeta(selected.id, meta);
                  if (res.ok) {
                    setItems((prev) => prev.map((m) => (m.id === selected.id ? { ...m, ...meta } : m)));
                    setEditing(null);
                    setSelected({ ...selected, ...meta });
                    router.refresh();
                  } else {
                    setError(res.error ?? null);
                  }
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-key-muted">Texto alternativo (SEO)</span>
                    <input
                      name="altText"
                      defaultValue={selected.altText ?? ""}
                      className="h-10 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-key-muted">Crédito</span>
                    <input
                      name="credit"
                      defaultValue={selected.credit ?? ""}
                      className="h-10 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-key-muted">Pie de foto</span>
                  <input
                    name="caption"
                    defaultValue={selected.caption ?? ""}
                    className="h-10 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-key-muted">Descripción</span>
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={selected.description ?? ""}
                    className="w-full rounded-lg border-2 border-key-border bg-key-surface px-3 py-2 text-sm outline-none focus:border-key-primary"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-key-primary px-4 text-sm font-bold text-white hover:bg-key-primary-dark"
                  >
                    <Check className="size-4" /> Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="h-10 rounded-full bg-key-surface-alt px-4 text-sm font-bold text-key-muted hover:text-key-ink"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(selected)}
                  className="rounded-full bg-key-surface-alt px-4 py-2 text-sm font-bold text-key-ink hover:bg-key-primary-soft"
                >
                  Editar metadatos
                </button>
                <ConfirmButton
                  className="py-2 text-sm"
                  onConfirm={async () => {
                    const res = await deleteMedia(selected.id);
                    if (res?.error) {
                      setError(res.error);
                      return;
                    }
                    setSelected(null);
                    router.refresh();
                    await load(q);
                  }}
                >
                  Eliminar archivo
                </ConfirmButton>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-key-muted">Sin resultados.</p>
        )}
        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setSelected(item);
              setEditing(null);
            }}
            className="group overflow-hidden rounded-xl border-2 border-key-border bg-key-white text-left transition-colors hover:border-key-primary"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-key-ink">
              <Image
                src={item.variants?.thumb?.url ?? item.url}
                alt={item.altText ?? item.filename}
                fill
                unoptimized
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="px-2.5 py-2">
              <p className="truncate text-xs font-bold text-key-ink" title={item.filename}>
                {item.filename}
              </p>
              <p className="text-[11px] text-key-muted">
                {item.width && item.height ? `${item.width}×${item.height}` : "SVG"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
