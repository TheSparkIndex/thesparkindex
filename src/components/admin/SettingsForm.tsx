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

      <div className="flex flex-col gap-3">
        <ErrorBox message={state?.error} />
        <SubmitButton pending={pending}>Guardar configuración</SubmitButton>
      </div>
    </form>
  );
}
