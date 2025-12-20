// frontend/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import Email from "next-auth/providers/email";

export const authOptions = {
  providers: [
    Email({
      server: process.env.EMAIL_SERVER!,
      from: process.env.EMAIL_FROM!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
