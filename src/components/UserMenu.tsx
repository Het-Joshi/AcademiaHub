"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function UserMenu() {
  const { user, logout, loading } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (loading) return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />;

  if (!user) {
    return (
      <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
        Log In
      </Link>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
          {user.username.charAt(0).toUpperCase()}
        </div>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border">
            <div className="px-4 py-2 border-b">
              <p className="font-bold text-sm">{user.username}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <Link href={`/profile/${user.username}`} className="block px-4 py-2 text-sm hover:bg-gray-100">
              My Profile
            </Link>
            {user.role === 'admin' && (
               <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-gray-100">
                 Admin Dashboard
               </Link>
            )}
            <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}