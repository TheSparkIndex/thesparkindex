import { listSubscribers, getSubscriberStats } from "@/lib/actions/subscribers";
import { SubscribersManager } from "@/components/admin/SubscribersManager";
import { Pagination } from "@/components/articles/Pagination";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminSubscribersPage({ searchParams }: PageProps<"/admin/suscriptores">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const [result, stats] = await Promise.all([
    listSubscribers(page, 50),
    getSubscriberStats(),
  ]);

  return (
    <div>
      <PageHeader
        title="Suscriptores"
        subtitle={`${stats.active} activos de ${stats.total} totales`}
      />
      <SubscribersManager subscribers={result.items} />

      <Pagination page={result.page} pages={result.pages} baseHref="/admin/suscriptores" className="mt-6" />
    </div>
  );
}
