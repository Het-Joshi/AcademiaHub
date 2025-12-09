"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  interests: string[];
  followedAuthors: string[];
  savedPapers: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  toggleSavePaper: (paperId: string, paperTitle?: string) => Promise<void>; // Added title
  updateInterests: (interests: string[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    router.push("/for-you");
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  const toggleSavePaper = async (paperId: string, paperTitle?: string) => {
    if (!user) {
        alert("Please login to save papers!"); 
        return; 
    }
    
    const isSaved = user.savedPapers.includes(paperId);
    const newSaved = isSaved 
        ? user.savedPapers.filter(id => id !== paperId)
        : [...user.savedPapers, paperId];
    
    setUser({ ...user, savedPapers: newSaved });

    await fetch("/api/user/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId, paperTitle, action: isSaved ? "remove" : "add" })
    });
  };

  const updateInterests = async (interests: string[]) => {
      if(!user) return;
      setUser({...user, interests});
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, toggleSavePaper, updateInterests }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};