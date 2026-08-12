import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Acceso editorial",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-key-ink px-4">
      <div className="bg-dotgrid-ink absolute inset-0 opacity-30" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="display block text-3xl text-white">
            KEY<span className="text-key-primary">.</span>
          </span>
          <span className="hand mt-1 block -rotate-2 text-2xl text-key-lime">The Spark Index</span>
          <p className="kicker mt-3 text-white/60">Panel editorial</p>
        </div>

        <div className="rounded-card border border-white/10 bg-white p-7 shadow-2xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-key-primary-soft">
              <Lock className="size-4 text-key-primary" aria-hidden />
            </span>
            <div>
              <h1 className="text-lg font-extrabold text-key-ink">Iniciar sesión</h1>
              <p className="text-xs text-key-muted">Solo personal editorial autorizado.</p>
            </div>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
