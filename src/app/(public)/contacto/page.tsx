import type { Metadata } from "next";
import { Mail, Send } from "lucide-react";

export const metadata: Metadata = {
  title: "Contáctanos",
  description: "¿Tienes una historia que contar, una pregunta o una propuesta? Escríbenos.",
};

export default function ContactPage() {
  return (
    <section className="container-key max-w-2xl py-10 sm:py-14">
      <div className="flex items-center gap-3 mb-6">
        <span className="grid size-10 place-items-center rounded-full bg-key-primary text-white">
          <Mail className="size-5" />
        </span>
        <div>
          <h1 className="display text-3xl font-black sm:text-4xl">Contáctanos</h1>
          <p className="text-sm text-key-muted">
            ¿Tienes una historia que contar, una pregunta o una propuesta? Escríbenos.
          </p>
        </div>
      </div>

      <form className="space-y-5 rounded-2xl border border-key-border bg-key-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-key-ink">
            Nombre <span className="text-key-orange">*</span>
          </span>
          <input
            type="text"
            required
            placeholder="Tu nombre completo"
            className="h-11 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-key-ink">
            Correo electrónico <span className="text-key-orange">*</span>
          </span>
          <input
            type="email"
            required
            placeholder="tu@correo.com"
            className="h-11 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-key-ink">Asunto</span>
          <input
            type="text"
            placeholder="¿Sobre qué nos escribes?"
            className="h-11 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none focus:border-key-primary"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-key-ink">
            Mensaje <span className="text-key-orange">*</span>
          </span>
          <textarea
            rows={5}
            required
            placeholder="Cuéntanos en detalle..."
            className="w-full rounded-lg border-2 border-key-border bg-key-surface px-3 py-2 text-sm outline-none focus:border-key-primary"
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-key-muted px-6 font-bold text-white opacity-60 cursor-not-allowed"
          >
            <Send className="size-4" /> Próximamente
          </button>
          <p className="text-xs text-key-muted">
            El envío de mensajes estará disponible pronto.
          </p>
        </div>
      </form>
    </section>
  );
}
