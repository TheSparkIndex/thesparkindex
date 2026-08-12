import Link from "next/link";
import { Plus } from "lucide-react";
import { adminListAuthors } from "@/lib/services/authors";
import { AuthorTable, type AdminAuthorRow } from "@/components/admin/AuthorTable";
import { PageHeader, Card } from "@/components/admin/ui";

export default async function AdminAuthorsPage() {
  const authors = await adminListAuthors();

  return (
    <div>
      <PageHeader
        title="Autores"
        subtitle={`${authors.length} firmas registradas`}
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
        <AuthorTable rows={authors as unknown as AdminAuthorRow[]} />
      </Card>
    </div>
  );
}
