"use client";

import { useActionState } from "react";
import { subscribeEmail } from "@/lib/actions/subscribers";
import { Mail, CheckCircle2, AlertTriangle } from "lucide-react";

export function NewsletterSubscribe({ compact }: { compact?: boolean }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => subscribeEmail(formData),
    undefined
  );

  if (state?.ok) {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
        <CheckCircle2 className="size-4 shrink-0" />
        ¡Gracias por suscribirte!
      </div>
    );
  }

  if (compact) {
    return (
      <form action={formAction} className="flex flex-col gap-2">
        <p className="text-sm font-bold text-white">Suscríbete al newsletter</p>
        <div className="flex gap-2">
          <input
            type="email"
            name="email"
            required
            placeholder="tu@correo.com"
            className="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-key-lime"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-lg bg-key-lime px-4 py-2 text-sm font-bold text-key-ink hover:brightness-95 disabled:opacity-60"
          >
            {pending ? "…" : "Suscribir"}
          </button>
        </div>
        {state?.error && (
          <p className="flex items-center gap-1 text-xs text-key-orange">
            <AlertTriangle className="size-3" /> {state.error}
          </p>
        )}
      </form>
    );
  }

  return (
    <section className="bg-key-ink py-12 text-white">
      <div className="container-key flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-key-lime text-key-ink">
            <Mail className="size-5" />
          </span>
          <div>
            <h3 className="display text-xl font-bold">Suscríbete al newsletter</h3>
            <p className="text-sm text-white/70">Recibe las mejores historias de Key en tu correo cada mes.</p>
          </div>
        </div>
        <form action={formAction} className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <input
            type="email"
            name="email"
            required
            placeholder="tu@correo.com"
            className="min-w-0 flex-1 rounded-lg bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-key-lime sm:w-64"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-lg bg-key-lime px-6 py-2.5 text-sm font-bold text-key-ink hover:brightness-95 disabled:opacity-60"
          >
            {pending ? "Enviando…" : "Suscribirme"}
          </button>
        </form>
        {state?.error && (
          <p className="flex items-center gap-1 text-sm text-key-orange">
            <AlertTriangle className="size-4" /> {state.error}
          </p>
        )}
      </div>
    </section>
  );
}
