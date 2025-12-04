"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserPrefsProvider } from "@/context/UserPrefsContext";
import { SessionProvider } from "next-auth/react";
import UserMenu from "@/components/UserMenu";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Providers for session and user preferences */}
        <SessionProvider>
          <UserPrefsProvider>
            <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                  <Link
                    href="/"
                    className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    AcademiaHub
                  </Link>

                  <div className="flex items-center space-x-1 md:space-x-2">
                    <NavLink href="/" label="Search" icon="🔍" />
                    <NavLink href="/for-you" label="For You" icon="✨" />
                    <NavLink href="/news" label="News Feed" icon="📰" />
                    <NavLink href="/saved" label="Saved" icon="⭐" />
                    <UserMenu />
                  </div>
                </div>
              </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8">
              {children}
            </main>

            <footer className="bg-gray-50 border-t mt-16">
              {/* Footer content */}
            </footer>
          </UserPrefsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

// Navigation link component with active state
function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (pathname.startsWith(href) && href !== "/");

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-md transition-colors
        ${
          isActive
            ? "font-bold text-blue-600 bg-blue-50"
            : "font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
        }
        p-2
        md:px-4 md:py-2
      `}
    >
      <span>{icon}</span>
      {/* Hide label on mobile, show on desktop */}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}