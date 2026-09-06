"use client";

import { useActionState } from "react";
import { saveSettings } from "@/lib/actions/admin";
import { Card, ErrorBox, Field, SubmitButton } from "./ui";

type Settings = {
  siteName?: unknown;
  tagline?: unknown;
  instagram?: unknown;
  tiktok?: unknown;
  twitter?: unknown;
  description?: unknown;
  bannerTitle?: unknown;
  bannerSubtitle?: unknown;
  bannerArticleSlug?: unknown;
  bannerEnabled?: unknown;
  bannerBgColor?: unknown;
  bannerTextColor?: unknown;
  bannerButtonBgColor?: unknown;
  bannerButtonTextColor?: unknown;
};

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => saveSettings(formData),
    undefined
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <Card>
        <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-key-muted">Identidad</h2>
        <div className="space-y-4">
          <Field label="Nombre del sitio" name="siteName" defaultValue={str(settings.siteName)} placeholder="KEY" />
          <Field label="Eslogan / tagline" name="tagline" defaultValue={str(settings.tagline)} placeholder="The Spark Index" />
          <Field
            label="Descripción (para SEO y redes)"
            name="description"
            defaultValue={str(settings.description)}
            placeholder="La revista estudiantil que enciende la curiosidad…"
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-key-muted">Redes sociales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram" name="instagram" defaultValue={str(settings.instagram)} placeholder="@key.magazine" />
          <Field label="TikTok" name="tiktok" defaultValue={str(settings.tiktok)} placeholder="@key.magazine" />
          <Field label="X / Twitter" name="twitter" defaultValue={str(settings.twitter)} placeholder="@keymagazine" />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-key-muted">Banner de portada</h2>
        <p className="mb-4 text-xs text-key-muted">Muestra un banner destacado arriba de la página de inicio.</p>
        <div className="space-y-4">
          <label className="flex items-center gap-2.5 text-sm font-bold text-key-ink">
            <input
              type="checkbox"
              name="bannerEnabled"
              defaultChecked={settings.bannerEnabled === true || settings.bannerEnabled === "true"}
              className="size-4 rounded border-key-border accent-key-primary"
            />
            Activar banner
          </label>
          <Field label="Título del banner" name="bannerTitle" defaultValue={str(settings.bannerTitle)} placeholder="Nuestra razón de ser" />
          <Field label="Subtítulo" name="bannerSubtitle" defaultValue={str(settings.bannerSubtitle)} placeholder="Una frase que acompañe el título" />
          <Field label="Slug del artículo" name="bannerArticleSlug" defaultValue={str(settings.bannerArticleSlug)} placeholder="nombre-del-articulo" hint="El slug del artículo al que enlaza el botón." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Color de fondo del banner"
              name="bannerBgColor"
              type="color"
              defaultValue={str(settings.bannerBgColor) || "#026DFD"}
            />
            <Field
              label="Color del texto"
              name="bannerTextColor"
              type="color"
              defaultValue={str(settings.bannerTextColor) || "#ffffff"}
            />
            <Field
              label="Color del botón «Leer más»"
              name="bannerButtonBgColor"
              type="color"
              defaultValue={str(settings.bannerButtonBgColor) || "#f5f500"}
            />
            <Field
              label="Color de letra del botón"
              name="bannerButtonTextColor"
              type="color"
              defaultValue={str(settings.bannerButtonTextColor) || "#16161a"}
            />
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <ErrorBox message={state?.error} />
        <SubmitButton pending={pending}>Guardar configuración</SubmitButton>
      </div>
    </form>
  );
}
