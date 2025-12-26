// frontend/lib/auth.ts

import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import { env } from "./env";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user?: {
      email?: string;
      id?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}

const emailHost = env("EMAIL_SERVER_HOST");

export const authOptions: NextAuthOptions = {
  providers: emailHost
    ? [
        EmailProvider({
          server: {
            host: emailHost,
            port: parseInt(env("EMAIL_SERVER_PORT") ?? "587"),
            auth: {
              user: env("EMAIL_SERVER_USER"),
              pass: env("EMAIL_SERVER_PASSWORD"),
            },
          },
          from: env("EMAIL_FROM") ?? "no-reply@local.app",
          maxAge: 24 * 60 * 60,
        }),
      ]
    : [],

  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const backendUrl = env("NEXT_PUBLIC_BACKEND_URL");
          if (!backendUrl) return token;

          const response = await fetch(
            `${backendUrl}/api/v1/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: user.email }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            token.accessToken = data.access_token;
          }
        } catch {
          // swallow error → no crash
        }
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
};
