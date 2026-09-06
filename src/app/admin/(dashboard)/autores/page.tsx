import Link from "next/link";
import { Plus } from "lucide-react";
import { adminListAuthorsPaginated } from "@/lib/services/authors";
import { AuthorTable, type AdminAuthorRow } from "@/components/admin/AuthorTable";
import { Pagination } from "@/components/articles/Pagination";
import { PageHeader, Card } from "@/components/admin/ui";

export default async function AdminAuthorsPage({ searchParams }: PageProps<"/admin/autores">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const { items, total, page: currentPage, pages } = await adminListAuthorsPaginated({ page, perPage: 50 });

  return (
    <div>
      <PageHeader
        title="Autores"
        subtitle={`${total} firmas registradas`}
        action={
          <Link
            href="/admin/autores/nuevo"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-key-primary px-5 font-bold text-white hover:bg-key-primary-dark"
          >
            <Plus className="size-4" /> Nuevo autor/a
          </Link>
        }
      />
      <Card className="p-0">
        <AuthorTable rows={items as unknown as AdminAuthorRow[]} />
      </Card>

      <Pagination page={currentPage} pages={pages} baseHref="/admin/autores" className="mt-6" />
    </div>
  );
}
