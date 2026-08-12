import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

// Next.js 16 Proxy (formerly middleware). Guards the admin area before
// reaching any page. Full authorization also happens server-side.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*"],
};
