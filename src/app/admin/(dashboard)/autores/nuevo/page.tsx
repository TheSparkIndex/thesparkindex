import { AuthorForm } from "@/components/admin/AuthorForm";
import { BackLink, PageHeader } from "@/components/admin/ui";

export default async function AdminAuthorNewPage() {
  return (
    <div>
      <BackLink href="/admin/autores">Autores</BackLink>
      <PageHeader title="Nuevo autor/a" subtitle="Registra una nueva firma del equipo editorial." />
      <AuthorForm />
    </div>
  );
}
