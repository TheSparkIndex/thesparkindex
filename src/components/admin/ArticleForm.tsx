"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ImagePlus } from "lucide-react";
import { saveArticle } from "@/lib/actions/admin";
import { slugify } from "@/lib/utils";
import { TiptapEditor, type TiptapEditorHandle } from "./editor/TiptapEditor";
import { useMediaPicker } from "./MediaPicker";
import { Card, Checkbox, ErrorBox, Select, SubmitButton, SuccessBox } from "./ui";

type AuthorOption = { id: string; name: string };
type Contributor = { authorId: string; role: "author" | "collaborator" | "photographer" | "editor" };

const ROLES: Array<{ value: Contributor["role"]; label: string }> = [
  { value: "author", label: "Autor/a" },
  { value: "collaborator", label: "Colaboración" },
  { value: "photographer", label: "Fotografía" },
  { value: "editor", label: "Edición" },
];

function toLocalInput(d: Date | null | undefined): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ArticleForm({
  article,
  sections,
  authors,
}: {
  article?: {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    excerpt: string | null;
    content: unknown;
    sectionId: string | null;
    heroMediaId: string | null;
    heroMedia?: { url: string; variants?: Record<string, { url: string }> | null } | null;
    imageCaption: string | null;
    status: string;
    scheduledAt: Date | null;
    featured: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
    tags: Array<{ name: string }>;
    authors: Array<{ author: AuthorOption; role: Contributor["role"] }>;
  } | null;
  sections: Array<{ id: string; name: string; slug: string }>;
  authors: AuthorOption[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => saveArticle(formData),
    undefined
  );
  const [status, setStatus] = useState(article?.status ?? "draft");
  const [featured, setFeatured] = useState(article?.featured ?? false);
  const [contributors, setContributors] = useState<Contributor[]>(
    article?.authors.map((a) => ({ authorId: a.author.id, role: a.role })) ?? []
  );
  const [tagsInput, setTagsInput] = useState(article?.tags.map((t) => t.name).join(", ") ?? "");
  const [heroMediaId, setHeroMediaId] = useState<string>(article?.heroMediaId ?? "");
  const [heroThumb, setHeroThumb] = useState<string | null>(
    article?.heroMedia?.variants?.card?.url ?? article?.heroMedia?.url ?? null
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const editorRef = useRef<TiptapEditorHandle>(null);
  const mediaPicker = useMediaPicker();

  useEffect(() => {
    if (state?.ok && state.articleId) {
      router.replace(`/admin/articulos/${state.articleId}`);
      router.refresh();
    }
  }, [state, router]);

  const heroSectionId = article?.sectionId ?? "";

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {mediaPicker.element}
      {article ? <input type="hidden" name="id" value={article.id} /> : null}

      <div className="space-y-6">
        <Card>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-key-ink">
              Título <span className="text-key-orange">*</span>
            </span>
            <input
              name="title"
              required
              defaultValue={article?.title ?? ""}
              onChange={(e) => {
                if (!slugTouched) {
                  const el = document.querySelector<HTMLInputElement>('input[name="slug"]');
                  if (el) el.value = slugify(e.target.value);
                }
              }}
              className="h-12 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-lg font-bold outline-none focus:border-key-primary"
              placeholder="Un titular que encienda la curiosidad…"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-key-ink">Slug</span>
              <input
                name="slug"
                defaultValue={article?.slug ?? ""}
                onChange={() => setSlugTouched(true)}
                className="h-11 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 font-mono text-sm outline-none focus:border-key-primary"
                placeholder="titular-impresionante"
              />
            </label>
            <Select
              label="Sección"
              name="sectionId"
              required
              defaultValue={heroSectionId}
              placeholder="Elegir sección…"
              options={sections.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>

          <div className="mt-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-key-ink">Bajada</span>
              <input
                name="subtitle"
                defaultValue={article?.subtitle ?? ""}
                className="h-11 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
                placeholder="Una frase que complete el titular (opcional)"
              />
            </label>
          </div>

          <div className="mt-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-key-ink">Extracto</span>
              <textarea
                name="excerpt"
                rows={3}
                defaultValue={article?.excerpt ?? ""}
                className="w-full rounded-lg border-2 border-key-border bg-key-surface px-3 py-2 text-sm outline-none focus:border-key-primary"
                placeholder="Resumen corto para tarjetas y meta descripción"
              />
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-key-muted">Contenido</h2>
          <TiptapEditor
            ref={editorRef}
            name="content"
            defaultValue={article?.content}
            onRequestImage={() => mediaPicker.pick((m) => editorRef.current?.insertImage(m.url, m.altText ?? m.filename))}
          />
          <p className="mt-2 text-xs text-key-muted">
            Atajos: <kbd className="rounded bg-key-surface-alt px-1">Ctrl+Alt+Q</kbd> cita destacada · Clic en «Imagen» o «YouTube» desde la barra para incrustar.
          </p>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-key-muted">Publicación</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Estado"
              name="status"
              value={status}
              onChangeValue={setStatus}
              options={[
                { value: "draft", label: "Borrador" },
                { value: "published", label: "Publicado" },
                { value: "scheduled", label: "Programado" },
                { value: "archived", label: "Archivado" },
              ]}
            />
            {status === "scheduled" && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-key-ink">Programar para</span>
                <input
                  name="scheduledAt"
                  type="datetime-local"
                  defaultValue={toLocalInput(article?.scheduledAt)}
                  className="h-11 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
                />
              </label>
            )}
          </div>

          <Checkbox
            className="mt-3"
            name="featured"
            label="Destacar en portada"
            checked={featured}
            onChange={setFeatured}
          />
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-key-muted">Portada</h2>
          {heroThumb ? (
            <div className="relative overflow-hidden rounded-xl border-2 border-key-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroThumb} alt="Vista previa" className="aspect-video w-full object-cover" />
              <input type="hidden" name="heroMediaId" value={heroMediaId} />
              <button
                type="button"
                onClick={() => mediaPicker.pick((m) => {
                  setHeroMediaId(m.id);
                  setHeroThumb(m.variants?.card?.url ?? m.url);
                })}
                className="absolute inset-0 grid place-items-center bg-key-ink/0 opacity-0 transition-opacity hover:bg-key-ink/30 hover:opacity-100"
              >
                <span className="rounded-full bg-key-white px-4 py-1.5 text-sm font-bold text-key-ink">Cambiar</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                mediaPicker.pick((m) => {
                  setHeroMediaId(m.id);
                  setHeroThumb(m.variants?.card?.url ?? m.url);
                })
              }
              className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-key-border text-key-muted transition-colors hover:border-key-primary hover:text-key-primary"
            >
              <ImagePlus className="size-7" />
              <span className="text-sm font-bold">Elegir imagen de portada</span>
            </button>
          )}
          <label className="mt-3 block">
            <span className="mb-1.5 block text-sm font-bold text-key-ink">Crédito / pie de foto</span>
            <input
              name="imageCaption"
              defaultValue={article?.imageCaption ?? ""}
              className="h-11 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
              placeholder="Foto: nombre del fotógrafo"
            />
          </label>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-key-muted">
            Firmas <span className="text-key-orange">*</span>
          </h2>
          <input type="hidden" name="contributors" value={JSON.stringify(contributors)} />
          <div className="space-y-2">
            {contributors.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={c.authorId}
                  onChange={(e) =>
                    setContributors((prev) => prev.map((p, i) => (i === idx ? { ...p, authorId: e.target.value } : p)))
                  }
                  className="h-10 min-w-0 flex-1 rounded-lg border-2 border-key-border bg-key-surface px-2 text-sm outline-none focus:border-key-primary"
                >
                  <option value="" disabled>
                    Elegir autor/a…
                  </option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <select
                  value={c.role}
                  onChange={(e) =>
                    setContributors((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, role: e.target.value as Contributor["role"] } : p))
                    )
                  }
                  className="h-10 rounded-lg border-2 border-key-border bg-key-surface px-2 text-sm outline-none focus:border-key-primary"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setContributors((prev) => prev.filter((_, i) => i !== idx))}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-key-muted hover:bg-key-orange/10 hover:text-key-orange"
                  aria-label="Quitar firma"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setContributors((prev) => [...prev, { authorId: "", role: "author" }])}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-key-primary hover:text-key-primary-dark"
          >
            <Plus className="size-4" /> Añadir firma
          </button>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-key-muted">Etiquetas</h2>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="h-11 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
            placeholder="innovación, estudiantes, campus"
          />
          <input type="hidden" name="tags" value={JSON.stringify(tagsInput.split(",").map((t) => t.trim()).filter(Boolean))} />
          <p className="mt-1 text-xs text-key-muted">Separa con comas.</p>
        </Card>

        <Card>
          <details>
            <summary className="cursor-pointer text-sm font-extrabold uppercase tracking-wide text-key-muted">
              SEO (opcional)
            </summary>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-key-ink">Título SEO</span>
                <input
                  name="seoTitle"
                  defaultValue={article?.seoTitle ?? ""}
                  maxLength={70}
                  className="h-11 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-key-ink">Descripción SEO</span>
                <textarea
                  name="seoDescription"
                  rows={3}
                  defaultValue={article?.seoDescription ?? ""}
                  maxLength={170}
                  className="w-full rounded-lg border-2 border-key-border bg-key-surface px-3 py-2 text-sm outline-none focus:border-key-primary"
                />
              </label>
            </div>
          </details>
        </Card>

        <div className="flex flex-col gap-3">
          <ErrorBox message={state?.error} />
          {state?.ok && <SuccessBox message={article ? "Artículo guardado con éxito." : "Artículo creado con éxito."} />}
          <SubmitButton pending={pending}>{article ? "Guardar cambios" : "Crear artículo"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
