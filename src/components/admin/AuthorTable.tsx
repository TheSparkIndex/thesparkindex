"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Edit, Trash2 } from "lucide-react";
import { deleteAuthor } from "@/lib/actions/admin";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmButton, StatusBadge } from "./ui";

export type AdminAuthorRow = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  role: string | null;
  program: string | null;
  isActive: boolean;
  photo?: { url: string; variants?: Record<string, { url: string }> | null } | null;
  _count: { articles: number };
};

export function AuthorTable({ rows }: { rows: AdminAuthorRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left">
        <thead>
          <tr className="border-b border-key-border text-xs font-black uppercase tracking-wide text-key-muted">
            <th className="px-4 py-3">Autor/a</th>
            <th className="px-4 py-3">Rol / programa</th>
            <th className="px-4 py-3">Artículos</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-key-border">
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-key-muted">Aún no hay autores.</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="text-sm hover:bg-key-surface-alt">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={row.photo?.variants?.thumb?.url ?? row.photo?.url}
                    name={row.name}
                    size="lg"
                    className="overflow-hidden bg-key-surface-alt"
                  />
                  <div className="min-w-0">
                    <Link href={`/admin/autores/${row.id}`} className="font-bold text-key-ink hover:text-key-primary">
                      {row.name}
                    </Link>
                    <p className="truncate text-xs text-key-muted">/autores/{row.slug}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-key-ink">{row.role ?? "Colaborador/a"}</p>
                {row.program && <p className="text-xs text-key-muted">{row.program}</p>}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-key-primary-soft px-2.5 py-1 text-xs font-black text-key-primary">{row._count.articles}</span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge active={row.isActive}>{row.isActive ? "Activo" : "Inactivo"}</StatusBadge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/autores/${row.id}`}
                    className="grid size-7 place-items-center rounded-md bg-key-surface-alt text-key-ink hover:bg-key-primary-soft"
                    aria-label={`Editar ${row.name}`}
                  >
                    <Edit className="size-3.5" />
                  </Link>
                  <ConfirmButton
                    title="Eliminar"
                    onConfirm={async () => {
                      startTransition(async () => {
                        await deleteAuthor(row.id);
                        router.refresh();
                      });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </ConfirmButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
