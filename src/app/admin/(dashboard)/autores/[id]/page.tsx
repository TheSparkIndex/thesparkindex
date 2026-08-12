import { notFound } from "next/navigation";
import { adminGetAuthor } from "@/lib/services/authors";
import { AuthorForm } from "@/components/admin/AuthorForm";
import { BackLink, PageHeader } from "@/components/admin/ui";

export default async function AdminAuthorEditPage({ params }: PageProps<"/admin/autores/[id]">) {
  const { id } = await params;
  const author = await adminGetAuthor(id);
  if (!author) notFound();

  return (
    <div>
      <BackLink href="/admin/autores">Autores</BackLink>
      <PageHeader title={author.name} subtitle={`${author._count.articles} artículos firmados`} />
      <AuthorForm
        author={{
          id: author.id,
          name: author.name,
          slug: author.slug,
          bio: author.bio,
          photoId: author.photoId,
          photoUrl: author.photo?.url ?? null,
          role: author.role,
          program: author.program,
          cohort: author.cohort,
          socialLinks: author.socialLinks as AuthorFormSocialLinks | undefined,
          isActive: author.isActive,
        }}
      />
    </div>
  );
}

type AuthorFormSocialLinks = {
  instagram?: string | null;
  linkedin?: string | null;
  github?: string | null;
  twitter?: string | null;
};
