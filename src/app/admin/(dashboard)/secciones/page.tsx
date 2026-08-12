import { adminListSections } from "@/lib/services/sections";
import { SectionsManager, type SectionRow } from "@/components/admin/SectionsManager";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminSectionsPage() {
  const sections = await adminListSections();

  return (
    <div>
      <PageHeader
        title="Secciones"
        subtitle="Gestiona las secciones de la revista y su color de acento."
      />
      <SectionsManager sections={sections as unknown as SectionRow[]} />
    </div>
  );
}
