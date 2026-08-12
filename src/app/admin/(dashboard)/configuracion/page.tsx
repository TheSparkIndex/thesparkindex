import { getSettingsMap } from "@/lib/services/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminSettingsPage() {
  const settings = await getSettingsMap();

  return (
    <div>
      <PageHeader title="Configuración" subtitle="Ajustes generales de la revista." />
      <SettingsForm settings={settings} />
    </div>
  );
}
