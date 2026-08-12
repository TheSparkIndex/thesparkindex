import { adminListAuthors } from "@/lib/services/authors";
import { adminListSections } from "@/lib/services/sections";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { BackLink, PageHeader } from "@/components/admin/ui";

export default async function AdminArticleNewPage() {
  const [sections, authors] = await Promise.all([adminListSections(), adminListAuthors()]);

  return (
    <div>
      <BackLink href="/admin/articulos">Artículos</BackLink>
      <PageHeader title="Nuevo artículo" subtitle="Crea el borrador y publícalo cuando esté listo." />
      <ArticleForm
        article={null}
        sections={sections}
        authors={authors.map((a) => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
}
