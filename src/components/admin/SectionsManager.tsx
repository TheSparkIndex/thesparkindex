"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, ImagePlus } from "lucide-react";
import { saveSection, deleteSection } from "@/lib/actions/admin";
import { slugify } from "@/lib/utils";
import { useMediaPicker } from "./MediaPicker";
import { ErrorBox } from "./ui";

export type SectionRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  sortOrder: number;
  imageId: string | null;
  image?: { url: string; variants?: Record<string, { url: string }> | null } | null;
  _count?: { articles: number };
};

const EMPTY: SectionRow = {
  id: "",
  name: "",
  slug: "",
  description: null,
  color: "#026DFD",
  isActive: true,
  sortOrder: 99,
  imageId: null,
};

function SectionEditor({ section, onSaved }: { section: SectionRow; onSaved: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [color, setColor] = useState(section.color ?? "#026DFD");
  const [isActive, setIsActive] = useState(section.isActive);
  const [imageId, setImageId] = useState(section.imageId ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(section.image?.variants?.card?.url ?? section.image?.url ?? null);
  const [slugTouched, setSlugTouched] = useState(Boolean(section.slug));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mediaPicker = useMediaPicker();

  return (
    <form
      action={async (formData) => {
        if (!slugTouched && !section.slug) {
          formData.set("slug", slugify(formData.get("name")!.toString()));
        }
        startTransition(async () => {
          const res = await saveSection(formData);
          if (res?.error) setError(res.error);
          else {
            onSaved();
            router.refresh();
          }
        });
      }}
      className="rounded-2xl border border-key-border bg-key-white p-4 shadow-sm"
    >
      {mediaPicker.element}
      {section.id ? <input type="hidden" name="id" value={section.id} /> : null}
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="imageId" value={imageId} />
      <input type="hidden" name="isActive" value={isActive ? "on" : ""} />
      <input type="hidden" name="sortOrder" value={section.sortOrder} />

      <div className="flex items-center gap-3">
        <span className="size-3 shrink-0 rounded-full ring-2 ring-key-white" style={{ backgroundColor: color }} aria-hidden />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-10 shrink-0 cursor-pointer rounded border border-key-border bg-key-white p-0.5"
          aria-label="Color de la sección"
        />
        <input
          name="name"
          required
          defaultValue={section.name}
          placeholder="Nombre de la sección"
          className="min-w-0 flex-1 rounded-lg border-2 border-key-border bg-key-surface px-3 py-2 text-sm font-bold outline-none focus:border-key-primary"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          name="slug"
          defaultValue={section.slug}
          onChange={() => setSlugTouched(true)}
          placeholder="slug"
          className="rounded-lg border-2 border-key-border bg-key-surface px-3 py-2 font-mono text-sm outline-none focus:border-key-primary"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => mediaPicker.pick((m) => { setImageId(m.id); setImageUrl(m.variants?.card?.url ?? m.url); })}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-key-border text-xs font-bold text-key-muted hover:border-key-primary hover:text-key-primary"
          >
            <ImagePlus className="size-4" />
            {imageUrl ? "Cambiar imagen" : "Imagen de cabecera"}
          </button>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-key-muted">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-3.5 accent-key-primary" />
            Activa
          </label>
        </div>
      </div>

      <textarea
        name="description"
        rows={2}
        defaultValue={section.description ?? ""}
        placeholder="Descripción breve"
        className="mt-3 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 py-2 text-sm outline-none focus:border-key-primary"
      />

      {error && <ErrorBox message={error} />}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-key-muted">{section._count ? `${section._count.articles} artículos` : "Nueva sección"}</span>
          {section.id && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); return; }
                startTransition(async () => {
                  const res = await deleteSection(section.id);
                  if (res?.error) setError(res.error);
                  else { onSaved(); router.refresh(); }
                });
              }}
              className="text-xs font-bold text-key-muted transition-colors hover:text-key-orange"
            >
              {confirmDelete ? "¿Seguro?" : "Eliminar"}
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-key-primary px-4 text-sm font-bold text-white hover:bg-key-primary-dark disabled:opacity-60"
        >
          <Save className="size-3.5" /> {pending ? "Guardando…" : section.id ? "Guardar" : "Crear"}
        </button>
      </div>
    </form>
  );
}

export function SectionsManager({ sections }: { sections: SectionRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  return (
    <div>
      {!adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-key-primary px-5 py-2.5 font-bold text-white hover:bg-key-primary-dark"
        >
          <Plus className="size-4" /> Nueva sección
        </button>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {adding && (
          <SectionEditor
            section={{ ...EMPTY, sortOrder: sections.length + 1 }}
            onSaved={() => setAdding(false)}
          />
        )}
        {sections.map((s) => (
          <SectionEditor key={s.id} section={s} onSaved={() => router.refresh()} />
        ))}
      </div>
    </div>
  );
}
