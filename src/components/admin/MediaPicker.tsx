"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Search, UploadCloud, X } from "lucide-react";
import { useMediaLibrary, type MediaItem } from "./useMediaLibrary";

export type { MediaItem } from "./useMediaLibrary";

export function MediaPicker({
  onSelect,
  onClose,
}: {
  onSelect: (media: MediaItem) => void;
  onClose: () => void;
}) {
  const { items, loading, uploading, error, q, setQ, load, upload } = useMediaLibrary({
    take: 60,
    autoLoad: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-key-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-key-border px-5 py-4">
          <h2 className="text-lg font-extrabold text-key-ink">Biblioteca de medios</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-9 place-items-center rounded-lg text-key-muted hover:bg-key-surface-alt"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-key-border px-5 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-key-muted" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                load(e.target.value);
              }}
              placeholder="Buscar por nombre…"
              className="h-10 w-full rounded-lg border-2 border-key-border bg-key-surface pl-9 pr-3 text-sm outline-none focus:border-key-primary"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-10 items-center justify-center gap-2 rounded-full bg-key-primary px-4 text-sm font-bold text-white hover:bg-key-primary-dark disabled:opacity-60"
          >
            <UploadCloud className="size-4" />
            {uploading ? "Subiendo…" : "Subir imagen"}
          </button>
        </div>

        {error && (
          <p className="border-b border-key-orange/30 bg-key-orange/10 px-5 py-2 text-sm font-semibold text-key-orange">{error}</p>
        )}

        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-3 md:grid-cols-4">
          {loading && <p className="col-span-full py-8 text-center text-sm text-key-muted">Cargando…</p>}
          {!loading && items.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-key-muted">Sin resultados. Sube una imagen.</p>
          )}
          {items.map((item) => {
            const thumb = item.variants?.thumb?.url ?? item.url;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className="group overflow-hidden rounded-xl border-2 border-key-border bg-key-surface-alt text-left transition-colors hover:border-key-primary"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-key-ink">
                  {item.mimeType.startsWith("image/") ? (
                    <Image
                      src={thumb}
                      alt={item.altText ?? item.filename}
                      fill
                      unoptimized
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-white/50">archivo</div>
                  )}
                </div>
                <div className="px-2.5 py-2">
                  <p className="truncate text-xs font-bold text-key-ink" title={item.filename}>
                    {item.filename}
                  </p>
                  {item.width && item.height ? (
                    <p className="text-[11px] text-key-muted">
                      {item.width}×{item.height}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function useMediaPicker() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<((m: MediaItem) => void) | null>(null);

  const pick = (resolve: (m: MediaItem) => void) => {
    setPending(() => resolve);
    setOpen(true);
  };

  const handleSelect = (m: MediaItem) => {
    pending?.(m);
    setPending(null);
    setOpen(false);
  };

  const close = () => {
    setPending(null);
    setOpen(false);
  };

  return {
    open,
    pick,
    element: open ? <MediaPicker onSelect={handleSelect} onClose={close} /> : null,
  };
}
