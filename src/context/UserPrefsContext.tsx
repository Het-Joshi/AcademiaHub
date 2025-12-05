"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserPrefs } from "@/types";
import { useAuth } from "./AuthContext"; // Import AuthContext

// Keep your existing interfaces...
interface UserPrefsContextType {
  prefs: UserPrefs;
  savedPaperIds: Set<string>;
  loading: boolean;
  addInterest: (interest: string) => void;
  removeInterest: (interest: string) => void;
  addAuthor: (author: string) => void;
  removeAuthor: (author: string) => void;
  toggleExcludedCategory: (category: string) => void;
  toggleSavePaper: (paperId: string) => void;
  isPaperSaved: (paperId: string) => boolean;
  setPreferences: (newPrefs: UserPrefs) => void;
}

const UserPrefsContext = createContext<UserPrefsContextType | undefined>(undefined);

export function UserPrefsProvider({ children }: { children: ReactNode }) {
  const { user, toggleSavePaper: authToggleSave, updateInterests: authUpdateInterests } = useAuth();
  
  // Default Guest State
  const [prefs, setPrefs] = useState<UserPrefs>({ interests: [], followedAuthors: [], excludedCategories: [] });
  const [savedPaperIds, setSavedPaperIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // 1. SYNC: If User logs in, load their data. If Guest, load LocalStorage.
  useEffect(() => {
    if (user) {
      setPrefs({
        interests: user.interests || [],
        followedAuthors: user.followedAuthors || [],
        excludedCategories: [], // Assuming you might add this to DB schema later
      });
      setSavedPaperIds(new Set(user.savedPapers || []));
      setLoading(false);
    } else {
      // Guest Logic (Load from LocalStorage)
      const savedPrefs = localStorage.getItem("scholarly_user_prefs");
      const savedIds = localStorage.getItem("scholarly_saved_papers");
      if (savedPrefs) setPrefs(JSON.parse(savedPrefs));
      if (savedIds) setSavedPaperIds(new Set(JSON.parse(savedIds)));
      setLoading(false);
    }
  }, [user]);

  // 2. HELPER: Save to DB if logged in, LocalStorage if guest
  const savePrefsState = (newPrefs: UserPrefs) => {
    setPrefs(newPrefs);
    if (user) {
      // Call API to sync interests/authors
      fetch("/api/user/prefs", {
        method: "POST",
        body: JSON.stringify(newPrefs)
      });
    } else {
      localStorage.setItem("scholarly_user_prefs", JSON.stringify(newPrefs));
    }
  };

  // 3. UPDATERS
  const addInterest = (interest: string) => {
    const newPrefs = { ...prefs, interests: [...prefs.interests, interest] };
    savePrefsState(newPrefs);
  };

  const removeInterest = (interest: string) => {
    const newPrefs = { ...prefs, interests: prefs.interests.filter(i => i !== interest) };
    savePrefsState(newPrefs);
  };

  const addAuthor = (author: string) => {
    const newPrefs = { ...prefs, followedAuthors: [...prefs.followedAuthors, author] };
    savePrefsState(newPrefs);
  };

  const removeAuthor = (author: string) => {
    const newPrefs = { ...prefs, followedAuthors: prefs.followedAuthors.filter(a => a !== author) };
    savePrefsState(newPrefs);
  };

  const toggleExcludedCategory = (category: string) => {
    // Exclusions are local-only for now unless you update User schema
    setPrefs(p => {
        const excluded = p.excludedCategories || [];
        const newExcluded = excluded.includes(category) 
            ? excluded.filter(c => c !== category) 
            : [...excluded, category];
        const newPrefs = { ...p, excludedCategories: newExcluded };
        if(!user) localStorage.setItem("scholarly_user_prefs", JSON.stringify(newPrefs));
        return newPrefs;
    });
  };

  const toggleSavePaper = (paperId: string) => {
    if (user) {
        authToggleSave(paperId); // Use AuthContext's DB logic
    } else {
        // Guest Logic
        setSavedPaperIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(paperId)) newSet.delete(paperId);
            else newSet.add(paperId);
            localStorage.setItem("scholarly_saved_papers", JSON.stringify([...newSet]));
            return newSet;
        });
    }
  };

  const isPaperSaved = (paperId: string) => {
    if (user) return user.savedPapers.includes(paperId);
    return savedPaperIds.has(paperId);
  };

  return (
    <UserPrefsContext.Provider value={{
      prefs, savedPaperIds, loading,
      addInterest, removeInterest, addAuthor, removeAuthor, toggleExcludedCategory,
      toggleSavePaper, isPaperSaved, setPreferences: savePrefsState
    }}>
      {children}
    </UserPrefsContext.Provider>
  );
}

export const useUserPrefs = () => {
  const context = useContext(UserPrefsContext);
  if (context === undefined) throw new Error("useUserPrefs must be used within a UserPrefsProvider");
  return context;
};