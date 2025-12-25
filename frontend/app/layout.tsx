// ============================================
// FILE: frontend/app/layout.tsx
// Root layout with navigation & footer
// ============================================

import type { Metadata } from "next";
import { Providers } from "./providers";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "GenZ AI - Chat with Multiple AI Models",
  description: "Fast, smart, and intelligent AI chat powered by Groq, OpenRouter, and more.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white min-h-screen flex flex-col">
        <Providers>
          <Navigation />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
