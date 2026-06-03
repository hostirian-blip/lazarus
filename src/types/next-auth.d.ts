// Augment NextAuth types so `tenantId` and `id` are first-class on the session.
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
    } & DefaultSession["user"];
  }

  interface User {
    tenantId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    tenantId: string;
  }
}
