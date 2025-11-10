// src/app/layout.tsx
"use client"; // Required for the hooks we're about to use

import type { Metadata } from "next"; // Metadata can still be exported
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Import usePathname
import { UserPrefsProvider } from "@/context/UserPrefsContext"; // Import our provider

const inter = Inter({ subsets: ["latin"] });

// You can still have static metadata in a client component layout
// export const metadata: Metadata = { ... };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap the entire application in the provider */}
        <UserPrefsProvider>
          <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-between items-center h-16">
                <Link
                  href="/"
                  className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  🎓 AcademiaHub
                </Link>

                <div className="flex items-center space-x-1">
                  {/* Pass the active state to NavLink */}
                  <NavLink href="/" label="Search" icon="🔍" />
                  <NavLink href="/for-you" label="For You" icon="✨" />
                  {/*
                    LOGIC/UX FIX:
                    - Renamed href from "/security" to "/news"
                    - Renamed label from "Tech News" to "News Feed"
                    - Changed icon from "🔒" to "📰"
                    This makes the link's purpose clear and matches the page.
                  */}
                  <NavLink href="/news" label="News Feed" icon="📰" />
                  <NavLink href="/saved" label="Saved" icon="⭐" />
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </main>

          {/* ... Your footer remains the same ... */}
          <footer className="bg-gray-50 border-t mt-16">
            {/* ... footer content ... */}
          </footer>
        </UserPrefsProvider>
      </body>
    </html>
  );
}

// --- Improved NavLink Component ---
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
  // Check if the current path matches the href.
  // This handles the root path "/" case correctly.
  const isActive =
    pathname === href || (pathname.startsWith(href) && href !== "/");

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors
        ${
          isActive
            ? "font-bold text-blue-600 bg-blue-50" // Active link style
            : "font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50" // Inactive link style
        }
      `}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}