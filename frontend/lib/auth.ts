// frontend/lib/auth.ts

import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { env } from "./env";

const emailHost = env("EMAIL_SERVER_HOST");

export const authOptions = {
  providers: emailHost
    ? [
        EmailProvider({
          server: {
            host: emailHost,
            port: Number(env("EMAIL_SERVER_PORT")),
            auth: {
              user: env("EMAIL_SERVER_USER"),
              pass: env("EMAIL_SERVER_PASSWORD"),
            },
          },
          from: env("EMAIL_FROM") ?? "no-reply@local.app",
        }),
      ]
    : [],
};

export const { handlers, auth } = NextAuth(authOptions);
