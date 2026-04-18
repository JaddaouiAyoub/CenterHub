import { Role } from "@/types/prisma";
import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    role: Role;
  }
}


declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
  }
}
