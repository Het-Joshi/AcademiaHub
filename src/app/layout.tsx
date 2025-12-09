"use client";
import "./globals.css";
import { Inter } from "next/font/google";
import { UserPrefsProvider } from "@/context/UserPrefsContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ZenKnowledgeBackground from "@/components/ZenBackground";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell"; // Import Bell

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <UserPrefsProvider>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
              <ZenKnowledgeBackground />
              {children}
            </main>
            <footer className="bg-stone-100/50 backdrop-blur border-t border-stone-200 mt-16 py-8 text-center text-stone-500">
              <p>© 2025 AcademiaHub. Research with focus.</p>
            </footer>
          </UserPrefsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

function Navbar() {
  const { user } = useAuth();
  return (
    <nav className="bg-[rgb(253,248,235)]/80 backdrop-blur-md shadow-sm border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-emerald-800 flex items-center gap-2">
            <span>🪷</span> AcademiaHub
          </Link>
          <div className="flex items-center space-x-1 md:space-x-2 text-stone-600">
            <NavLink href="/" label="Search" icon="🔍" />
            <NavLink href="/for-you" label="For You" icon="🎋" />
            <NavLink href="/news" label="News" icon="📰" />
            {user ? (
              <>
                <NavLink href="/saved" label="Saved" icon="⭐" />
                <NavLink href={`/profile/${user.username}`} label={user.username} icon="👤" />
                <div className="ml-2 pl-2 border-l border-stone-300">
                   <NotificationBell username={user.username} />
                </div>
              </>
            ) : (
              <NavLink href="/login" label="Login" icon="🔐" />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  // Simple check: active if strict match or starts with href (except root)
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-md transition-all duration-200
        ${isActive 
            ? "font-bold text-emerald-800 bg-emerald-100/50 shadow-sm" 
            : "font-medium text-stone-600 hover:text-emerald-700 hover:bg-emerald-50/50"}
        p-2 md:px-4 md:py-2`}
    >
      <span className="text-lg">{icon}</span>
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}