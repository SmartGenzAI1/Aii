// frontend/app/layout.tsx

import "./globals.css";
import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
        <header className="border-b">
          <nav className="max-w-5xl mx-auto flex justify-between p-4">
            <Link href="/" className="font-bold">
              YourAI
            </Link>

            <div className="flex gap-4 text-sm">
              <Link href="/chat">Chat</Link>
              <Link href="/settings">Settings</Link>
              <Link href="/about">About</Link>
            </div>
          </nav>
        </header>

        <main className="max-w-5xl mx-auto">{children}</main>

        <footer className="border-t text-sm text-gray-500 p-4 text-center">
          © {new Date().getFullYear()} YourAI ·
          <Link href="/policy" className="ml-2">Policy</Link>
        </footer>
      </body>
    </html>
  );
}
