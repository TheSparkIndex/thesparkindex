import type { NextAuthConfig } from "next-auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginRateLimit } from "@/lib/rate-limit";

export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  providers: [
    {
      id: "credentials",
      name: "Credenciales",
      type: "credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        // Rate limit by email + IP (IP unavailable here, so keyed by email).
        if (!loginRateLimit(email)) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as string) ?? "viewer";
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isProtected =
        path.startsWith("/admin") &&
        !path.startsWith("/admin/login") &&
        !path.startsWith("/api/auth");
      if (isProtected) {
        if (!isLoggedIn) return false;
        if (auth?.user?.role !== "superadmin") return false;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
