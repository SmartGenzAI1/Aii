// ============================================
// FILE: frontend/components/Navigation.tsx
// Top navigation bar
// ============================================

"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Menu, X, Zap } from "lucide-react";
import { useState } from "react";

export function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Chat", href: "/chat" },
    { label: "About", href: "/about" },
    { label: "FAQs", href: "/faqs" },
    { label: "Settings", href: "/settings" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 border-b border-blue-500/20 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl hidden sm:inline bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              GenZ AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors pb-2 border-b-2 ${
                  isActive(item.href)
                    ? "text-blue-400 border-blue-400"
                    : "text-slate-400 border-transparent hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400 hidden sm:inline">
                  {session.user?.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("email")}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium text-sm"
              >
                Login
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
