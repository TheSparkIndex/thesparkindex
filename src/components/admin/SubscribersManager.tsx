"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Copy, Check, Trash2 } from "lucide-react";
import { deleteSubscriber, exportSubscribersCSV } from "@/lib/actions/subscribers";
import { Card, ConfirmButton, StatusBadge } from "./ui";

type SubscriberRow = {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: Date;
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-SV", { dateStyle: "short" }).format(d);
}

export function SubscribersManager({ subscribers }: { subscribers: SubscriberRow[] }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  async function handleDownload() {
    const csv = await exportSubscribersCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suscriptores-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopyEmails() {
    const csv = await exportSubscribersCSV();
    const emails = csv
      .split("\n")
      .slice(1)
      .map((line) => line.split(",")[0])
      .filter(Boolean)
      .join(", ");
    await navigator.clipboard.writeText(emails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-full bg-key-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-key-primary-dark"
        >
          <Download className="size-4" /> Descargar CSV
        </button>
        <button
          type="button"
          onClick={handleCopyEmails}
          className="inline-flex items-center gap-2 rounded-full bg-key-surface-alt px-5 py-2.5 text-sm font-bold text-key-ink hover:bg-key-border"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "¡Copiado!" : "Copiar emails"}
        </button>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-key-border text-xs font-black uppercase tracking-wide text-key-muted">
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-key-border">
              {subscribers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-key-muted">
                    Aún no hay suscriptores.
                  </td>
                </tr>
              )}
              {subscribers.map((s) => (
                <tr key={s.id} className="text-sm hover:bg-key-surface-alt">
                  <td className="px-5 py-3 font-semibold text-key-ink">{s.email}</td>
                  <td className="px-5 py-3 text-key-muted">{s.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <StatusBadge active={s.isActive}>{s.isActive ? "Activo" : "Inactivo"}</StatusBadge>
                  </td>
                  <td className="px-5 py-3 text-xs text-key-muted">{formatDate(s.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <ConfirmButton
                        title="Eliminar"
                        onConfirm={async () => {
                          startTransition(async () => {
                            await deleteSubscriber(s.id);
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
      </Card>
    </div>
  );
}
