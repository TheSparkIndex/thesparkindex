import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { UsersManager } from "@/components/admin/UsersManager";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  return (
    <div>
      <PageHeader title="Usuarios" subtitle="Cuentas con acceso al panel editorial." />
      <UsersManager users={users} currentUserId={session.user.id} />
    </div>
  );
}
