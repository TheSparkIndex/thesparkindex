import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { UsersManager } from "@/components/admin/UsersManager";
import { Pagination } from "@/components/articles/Pagination";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/usuarios">) {
  const session = await requireAdmin();
  const sp = await searchParams;
  const perPage = 50;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const [users, total] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    }),
    db.user.count(),
  ]);

  return (
    <div>
      <PageHeader title="Usuarios" subtitle="Cuentas con acceso al panel editorial." />
      <UsersManager users={users} currentUserId={session.user.id} />

      <Pagination
        page={page}
        pages={Math.max(1, Math.ceil(total / perPage))}
        baseHref="/admin/usuarios"
        className="mt-6"
      />
    </div>
  );
}
