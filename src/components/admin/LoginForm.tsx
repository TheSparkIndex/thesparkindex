"use client";

import { useActionState } from "react";
import { authenticate, type LoginState } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(authenticate, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-key-ink">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@key.edu.sv"
          className="h-11 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none transition-colors focus:border-key-primary"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-key-ink">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-11 w-full rounded-lg border-2 border-key-border bg-key-surface px-3 text-sm outline-none transition-colors focus:border-key-primary"
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-key-orange/10 px-3 py-2 text-sm font-semibold text-key-orange">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-11 rounded-full bg-key-primary font-bold text-white transition-colors hover:bg-key-primary-dark disabled:opacity-60"
      >
        {pending ? "Verificando…" : "Entrar"}
      </button>
    </form>
  );
}
