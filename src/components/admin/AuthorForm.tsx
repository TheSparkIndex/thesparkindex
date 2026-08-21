"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ImagePlus } from "lucide-react";
import { saveAuthor } from "@/lib/actions/admin";
import { slugify } from "@/lib/utils";
import { useMediaPicker } from "./MediaPicker";
import { Card, Checkbox, ErrorBox, Field, SubmitButton, SuccessBox, Textarea } from "./ui";

type AuthorFormData = {
  id?: string;
  name: string;
  slug: string;
  bio: string | null;
  photoId: string | null;
  photoUrl?: string | null;
  role: string | null;
  program: string | null;
  cohort: string | null;
  socialLinks?: { instagram?: string | null; linkedin?: string | null; github?: string | null; twitter?: string | null };
  isActive: boolean;
};

export function AuthorForm({ author }: { author?: AuthorFormData }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => saveAuthor(formData),
    undefined
  );
  const [photoId, setPhotoId] = useState(author?.photoId ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(author?.photoUrl ?? null);
  const [isActive, setIsActive] = useState(author?.isActive ?? true);
  const [slugTouched, setSlugTouched] = useState(Boolean(author));
  const [social, setSocial] = useState({
    instagram: author?.socialLinks?.instagram ?? "",
    linkedin: author?.socialLinks?.linkedin ?? "",
    github: author?.socialLinks?.github ?? "",
    twitter: author?.socialLinks?.twitter ?? "",
  });
  const mediaPicker = useMediaPicker();

  useEffect(() => {
    if (state?.ok && state.authorId) {
      router.replace(`/admin/autores/${state.authorId}`);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {mediaPicker.element}
      {author?.id ? <input type="hidden" name="id" value={author.id} /> : null}
      <input type="hidden" name="photoId" value={photoId} />
      <input type="hidden" name="isActive" value={isActive ? "on" : ""} />

      <div className="space-y-6">
        <Card>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-key-ink">
              Nombre completo <span className="text-key-orange">*</span>
            </span>
            <input
              name="name"
              required
              defaultValue={author?.name}
              onChange={(e) => {
                if (!slugTouched) {
                  const el = document.querySelector<HTMLInputElement>('input[name="slug"]');
                  if (el) el.value = slugify(e.target.value);
                }
              }}
              className="h-11 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
            />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Slug"
              name="slug"
              required
              defaultValue={author?.slug}
              placeholder="nombre-apellido"
              onChangeValue={() => setSlugTouched(true)}
            />
            <Field label="Rol (título)" name="role" defaultValue={author?.role} placeholder="Editora jefa, Redactor…" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Programa" name="program" defaultValue={author?.program} placeholder="Ingeniería en Software" />
            <Field label="Cohorte / promoción" name="cohort" defaultValue={author?.cohort} placeholder="2026" />
          </div>
          <div className="mt-4">
            <Textarea label="Bio" name="bio" rows={5} defaultValue={author?.bio} hint="Se muestra en la página de autores." />
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-key-muted">Redes sociales</h2>
          <input
            type="hidden"
            name="socialLinks"
            value={JSON.stringify({
              instagram: social.instagram || null,
              linkedin: social.linkedin || null,
              github: social.github || null,
              twitter: social.twitter || null,
            })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Instagram"
              name="instagram"
              defaultValue={social.instagram}
              placeholder="@usuario"
              onChangeValue={(v) => setSocial((s) => ({ ...s, instagram: v }))}
            />
            <Field
              label="LinkedIn"
              name="linkedin"
              defaultValue={social.linkedin}
              placeholder="URL del perfil"
              onChangeValue={(v) => setSocial((s) => ({ ...s, linkedin: v }))}
            />
            <Field
              label="GitHub"
              name="github"
              defaultValue={social.github}
              placeholder="usuario"
              onChangeValue={(v) => setSocial((s) => ({ ...s, github: v }))}
            />
            <Field
              label="X / Twitter"
              name="twitter"
              defaultValue={social.twitter}
              placeholder="@usuario"
              onChangeValue={(v) => setSocial((s) => ({ ...s, twitter: v }))}
            />
          </div>
        </Card>

        <Checkbox
          className="cursor-pointer"
          name="isActive"
          label="Autor/a activo (visible en el sitio)"
          checked={isActive}
          onChange={setIsActive}
        />
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-key-muted">Foto de perfil</h2>
          {photoUrl ? (
            <div className="relative overflow-hidden rounded-full border-2 border-key-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="Foto de perfil" className="mx-auto aspect-square w-40 rounded-full object-cover" />
              <button
                type="button"
                onClick={() => mediaPicker.pick((m) => { setPhotoId(m.id); setPhotoUrl(m.url); })}
                className="mt-2 w-full rounded-lg bg-key-surface-alt py-2 text-sm font-bold text-key-ink hover:bg-key-primary-soft"
              >
                Cambiar foto
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => mediaPicker.pick((m) => { setPhotoId(m.id); setPhotoUrl(m.url); })}
              className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-full border-2 border-dashed border-key-border text-key-muted hover:border-key-primary hover:text-key-primary"
            >
              <ImagePlus className="size-8" />
              <span className="text-sm font-bold">Elegir foto</span>
            </button>
          )}
        </Card>

        <div className="flex flex-col gap-3">
          <ErrorBox message={state?.error} />
          {state?.ok && <SuccessBox message={author ? "Autor actualizado con éxito." : "Autor creado con éxito."} />}
          <SubmitButton pending={pending}>{author ? "Guardar cambios" : "Crear autor/a"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
