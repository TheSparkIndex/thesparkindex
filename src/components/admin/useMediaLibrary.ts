"use client";

import { useCallback, useEffect, useState } from "react";

export type MediaItem = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  variants?: Record<string, { url: string }> | null;
  altText?: string | null;
};

export function useMediaLibrary<T extends MediaItem = MediaItem>({
  initial = [],
  take = 60,
  autoLoad = false,
  onUpload,
}: {
  initial?: T[];
  take?: number;
  autoLoad?: boolean;
  onUpload?: (item: T) => void;
} = {}) {
  const [items, setItems] = useState<T[]>(initial);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(
    async (query = "") => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/media?take=${take}${query ? `&q=${encodeURIComponent(query)}` : ""}`);
        const data = await res.json();
        setItems(data.media ?? []);
      } catch {
        setError("No se pudo cargar la biblioteca.");
      } finally {
        setLoading(false);
      }
    },
    [take]
  );

  useEffect(() => {
    if (!autoLoad) return;
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [autoLoad, load]);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/media", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok || !data.media) throw new Error(data.error ?? "Subida fallida");
        setItems((prev) => [data.media, ...prev]);
        onUpload?.(data.media);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  return { items, setItems, loading, uploading, error, setError, q, setQ, load, upload };
}
