// frontend/lib/auth.ts

import EmailProvider from "next-auth/providers/email";

export const emailProvider = EmailProvider({
  server: process.env.EMAIL_SERVER!,
  from: process.env.EMAIL_FROM!,
  async sendVerificationRequest({ identifier, url, provider }) {
    // Default implementation is fine
    // Subject will be:
    // "Sign in to GeNZ AI"
  },
});
