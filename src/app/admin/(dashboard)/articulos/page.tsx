import Link from "next/link";
import { Plus } from "lucide-react";
import { adminListArticles } from "@/lib/services/articles";
import { ArticleTable, type AdminArticleRow } from "@/components/admin/ArticleTable";
import { Pagination } from "@/components/articles/Pagination";
import { PageHeader, Card } from "@/components/admin/ui";
import { ArticleStatus } from "@/generated/prisma/client";

const TABS: Array<{ label: string; value: ArticleStatus | "all" }> = [
  { label: "Todos", value: "all" },
  { label: "Publicados", value: ArticleStatus.published },
  { label: "Borradores", value: ArticleStatus.draft },
  { label: "Programados", value: ArticleStatus.scheduled },
  { label: "Archivados", value: ArticleStatus.archived },
];

export default async function AdminArticlesPage({
  searchParams,
}: PageProps<"/admin/articulos">) {
  const sp = await searchParams;
  const statusParam = String(sp.status ?? "all");
  const status = (Object.values(ArticleStatus) as string[]).includes(statusParam)
    ? (statusParam as ArticleStatus)
    : undefined;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const { items, total, page: currentPage, pages } = await adminListArticles({ status, page, perPage: 50 });

  return (
    <div>
      <PageHeader
        title="Artículos"
        subtitle={`${total} resultados`}
        action={
          <Link
            href="/admin/articulos/nuevo"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-key-primary px-5 font-bold text-white hover:bg-key-primary-dark"
          >
            <Plus className="size-4" /> Nuevo artículo
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = tab.value === "all" ? !status : status === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value === "all" ? "/admin/articulos" : `/admin/articulos?status=${tab.value}`}
              className={
                active
                  ? "rounded-full bg-key-primary px-4 py-1.5 text-sm font-bold text-white"
                  : "rounded-full bg-key-surface-alt px-4 py-1.5 text-sm font-bold text-key-muted hover:text-key-ink"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <Card className="p-0">
        <ArticleTable rows={items as unknown as AdminArticleRow[]} />
      </Card>

      <Pagination
        page={currentPage}
        pages={pages}
        baseHref="/admin/articulos"
        query={status ? { status } : {}}
        className="mt-6"
      />
    </div>
  );
}
