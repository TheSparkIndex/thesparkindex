import { listSubscribers, getSubscriberStats } from "@/lib/actions/subscribers";
import { SubscribersManager } from "@/components/admin/SubscribersManager";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminSubscribersPage() {
  const [subscribers, stats] = await Promise.all([
    listSubscribers(),
    getSubscriberStats(),
  ]);

  return (
    <div>
      <PageHeader
        title="Suscriptores"
        subtitle={`${stats.active} activos de ${stats.total} totales`}
      />
      <SubscribersManager subscribers={subscribers} />
    </div>
  );
}
