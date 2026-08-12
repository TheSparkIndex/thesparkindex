import { requireAdmin } from "@/lib/auth/guard";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return <AdminShell userName={session.user.name ?? "Editor"}>{children}</AdminShell>;
}
