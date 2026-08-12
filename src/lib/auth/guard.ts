import { redirect } from "next/navigation";
import { auth } from "./index";

const MIN_ROLE: Record<string, number> = {
  viewer: 0,
  author: 1,
  editor: 2,
  admin: 3,
  superadmin: 4,
};

export async function requireAdmin(role: "author" | "editor" | "admin" | "superadmin" = "admin") {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }
  const userRole = session.user.role ?? "viewer";
  if ((MIN_ROLE[userRole] ?? 0) < MIN_ROLE[role]) {
    redirect("/admin/login");
  }
  return session;
}
