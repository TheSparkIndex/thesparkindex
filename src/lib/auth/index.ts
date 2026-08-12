import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
};
