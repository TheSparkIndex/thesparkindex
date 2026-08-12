import { notFound } from "next/navigation";
import { adminGetArticle } from "@/lib/services/articles";
import { adminListAuthors } from "@/lib/services/authors";
import { adminListSections } from "@/lib/services/sections";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { BackLink, PageHeader } from "@/components/admin/ui";

export default async function AdminArticleEditPage({ params }: PageProps<"/admin/articulos/[id]">) {
  const { id } = await params;
  const [article, sections, authors] = await Promise.all([
    adminGetArticle(id),
    adminListSections(),
    adminListAuthors(),
  ]);
  if (!article) notFound();

  return (
    <div>
      <BackLink href="/admin/articulos">Artículos</BackLink>
      <PageHeader title={article.title} subtitle={`${article.status} · Actualizado ${article.updatedAt.toLocaleDateString("es-SV")}`} />
      <ArticleForm
        article={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          subtitle: article.subtitle,
          excerpt: article.excerpt,
          content: article.content,
          sectionId: article.sectionId,
          heroMediaId: article.heroMediaId,
          heroMedia: (article.heroMedia as unknown as {
            url: string;
            variants?: Record<string, { url: string }> | null;
          } | null) ?? null,
          imageCaption: article.imageCaption,
          status: article.status,
          scheduledAt: article.scheduledAt,
          featured: article.featured,
          seoTitle: article.seoTitle,
          seoDescription: article.seoDescription,
          tags: article.tags,
          authors: article.authors.map((a) => ({ author: { id: a.author.id, name: a.author.name }, role: a.role })),
        }}
        sections={sections}
        authors={authors.map((a) => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
}
