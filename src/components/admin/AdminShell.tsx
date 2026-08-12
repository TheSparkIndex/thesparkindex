"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Images,
  Tags,
  UserCog,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/articulos", label: "Artículos", icon: FileText },
  { href: "/admin/autores", label: "Autores", icon: Users },
  { href: "/admin/media", label: "Media", icon: Images },
  { href: "/admin/secciones", label: "Secciones", icon: Tags },
  { href: "/admin/usuarios", label: "Usuarios", icon: UserCog },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-key-surface-alt">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-key-ink text-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Navegación del panel"
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/admin/dashboard" className="flex items-baseline gap-1.5">
            <span className="display text-xl font-black text-white">KEY.</span>
            <span className="hand text-base -rotate-2 text-key-lime">panel</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid size-8 place-items-center rounded-lg text-white/70 hover:bg-white/10 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-key-primary text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 px-3 py-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="size-4" aria-hidden />
            Ver el sitio
          </Link>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" aria-hidden />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-key-border bg-key-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid size-9 place-items-center rounded-lg text-key-ink hover:bg-key-surface-alt lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-key-primary text-xs font-black text-white" aria-hidden>
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden text-sm font-bold text-key-ink sm:block">{userName}</span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
