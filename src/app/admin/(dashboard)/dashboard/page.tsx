import Link from "next/link";
import { FileText, DraftingCompass, CalendarClock, Users, Images, Star, Plus } from "lucide-react";
import { adminDashboardStats, adminRecentActivity } from "@/lib/services/articles";
import { PageHeader, Card, StatusBadge } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { ArticleStatus } from "@/generated/prisma/client";

const STATUS_LABEL: Record<string, string> = {
  [ArticleStatus.published]: "Publicado",
  [ArticleStatus.draft]: "Borrador",
  [ArticleStatus.scheduled]: "Programado",
  [ArticleStatus.archived]: "Archivado",
};

const STATUS_ACTIVE: Record<string, boolean> = {
  [ArticleStatus.published]: true,
  [ArticleStatus.draft]: false,
  [ArticleStatus.scheduled]: true,
  [ArticleStatus.archived]: false,
};

function kindLabel(kind: string) {
  if (kind === "article") return "bg-key-primary-soft text-key-primary";
  if (kind === "author") return "bg-key-orange-soft text-key-orange";
  return "bg-key-lime-soft text-key-ink";
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-SV", { dateStyle: "short", timeStyle: "short" }).format(d);
}

export default async function AdminDashboardPage() {
  const stats = await adminDashboardStats();
  const activity = await adminRecentActivity();

  const tiles = [
    { label: "Publicados", value: stats.published, icon: FileText, href: "/admin/articulos?status=published", tone: "bg-key-primary" },
    { label: "Borradores", value: stats.drafts, icon: DraftingCompass, href: "/admin/articulos?status=draft", tone: "bg-key-muted" },
    { label: "Programados", value: stats.scheduled, icon: CalendarClock, href: "/admin/articulos?status=scheduled", tone: "bg-key-orange" },
    { label: "Autores", value: stats.authors, icon: Users, href: "/admin/autores", tone: "bg-key-ink" },
    { label: "Archivos media", value: stats.mediaCount, icon: Images, href: "/admin/media", tone: "bg-key-lime" },
    { label: "Destacados", value: stats.featured, icon: Star, href: "/admin/articulos?featured=1", tone: "bg-key-lime-soft text-key-ink" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`${stats.totalArticles} artículos en total. Todo bajo control.`}
        action={
          <Link
            href="/admin/articulos/nuevo"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-key-primary px-5 font-bold text-white hover:bg-key-primary-dark"
          >
            <Plus className="size-4" /> Nuevo artículo
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="rounded-2xl border border-key-border bg-key-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <span className={cn("grid size-9 place-items-center rounded-lg text-white", t.tone)}>
              <t.icon className="size-4" />
            </span>
            <p className="mt-3 text-3xl font-black tracking-tight text-key-ink">{t.value}</p>
            <p className="text-xs font-bold text-key-muted">{t.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Card className="p-0">
          <h2 className="border-b border-key-border px-5 py-4 text-sm font-extrabold uppercase tracking-wide text-key-muted">
            Actividad reciente
          </h2>
          <ul className="divide-y divide-key-border">
            {activity.length === 0 && <li className="px-5 py-6 text-sm text-key-muted">Aún no hay actividad.</li>}
            {activity.map((event) => (
              <li key={event.id} className="flex items-center gap-3 px-5 py-3">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-black uppercase", kindLabel(event.kind))}>
                  {event.kind}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-key-ink">{event.label}</span>
                <span className="text-xs text-key-muted">{formatDate(event.at)}</span>
                {event.kind === "article" && event.status && (
                  <span className="hidden sm:block">
                    <StatusBadge active={STATUS_ACTIVE[event.status]}>
                      {STATUS_LABEL[event.status]}
                    </StatusBadge>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
