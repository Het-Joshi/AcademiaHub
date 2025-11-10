// src/context/UserPrefsContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback }
  from "react";
import { UserPrefs } from "@/types"; // Assumes UserPrefs includes savedPapers

// --- Constants for localStorage keys ---
const PREFS_KEY = "scholarly_user_prefs";
const SAVED_PAPERS_KEY = "scholarly_saved_papers";

// --- Define the shape of our context ---
interface UserPrefsContextType {
  prefs: UserPrefs;
  savedPaperIds: Set<string>;
  loading: boolean;
  // --- Preference updaters ---
  addInterest: (interest: string) => void;
  removeInterest: (interest: string) => void;
  addAuthor: (author: string) => void;
  removeAuthor: (author: string) => void;
  toggleExcludedCategory: (category: string) => void;
  // --- Saved paper updaters ---
  toggleSavePaper: (paperId: string) => void;
  isPaperSaved: (paperId: string) => boolean;
  // --- Full preferences object setter ---
  setPreferences: (newPrefs: UserPrefs) => void;
}

// --- Create the context with a default (empty) value ---
const UserPrefsContext = createContext<UserPrefsContextType | undefined>(undefined);

// --- Define the Provider component ---
export function UserPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<UserPrefs>({
    interests: [],
    followedAuthors: [],
    excludedCategories: [],
  });
  const [savedPaperIds, setSavedPaperIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // --- Load initial state from localStorage ---
  useEffect(() => {
    try {
      // Load preferences
      const savedPrefs = localStorage.getItem(PREFS_KEY);
      if (savedPrefs) {
        setPrefs(JSON.parse(savedPrefs));
      }
      
      // Load saved paper IDs
      const savedIds = localStorage.getItem(SAVED_PAPERS_KEY);
      if (savedIds) {
        setSavedPaperIds(new Set(JSON.parse(savedIds)));
      }
    } catch (error) {
      console.error("Failed to load user preferences from localStorage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Effect to save preferences to localStorage on change ---
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    }
  }, [prefs, loading]);

  // --- Effect to save paper IDs to localStorage on change ---
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(SAVED_PAPERS_KEY, JSON.stringify([...savedPaperIds]));
    }
  }, [savedPaperIds, loading]);

  // --- Helper function for setting preferences ---
  const setPreferences = (newPrefs: UserPrefs) => {
    setPrefs(newPrefs);
  };

  // --- Preference updaters (with callback) ---
  const addInterest = (interest: string) => {
    setPrefs(p => {
      if (!p.interests.includes(interest)) {
        return { ...p, interests: [...p.interests, interest] };
      }
      return p;
    });
  };

  const removeInterest = (interest: string) => {
    setPrefs(p => ({
      ...p,
      interests: p.interests.filter(i => i !== interest),
    }));
  };

  const addAuthor = (author: string) => {
    setPrefs(p => {
      if (!p.followedAuthors.includes(author)) {
        return { ...p, followedAuthors: [...p.followedAuthors, author] };
      }
      return p;
    });
  };

  const removeAuthor = (author: string) => {
    setPrefs(p => ({
      ...p,
      followedAuthors: p.followedAuthors.filter(a => a !== author),
    }));
  };

  const toggleExcludedCategory = (category: string) => {
    setPrefs(p => {
      const excluded = p.excludedCategories || [];
      if (excluded.includes(category)) {
        return { ...p, excludedCategories: excluded.filter(c => c !== category) };
      } else {
        return { ...p, excludedCategories: [...excluded, category] };
      }
    });
  };

  // --- Saved paper updaters (with callback) ---
  const toggleSavePaper = (paperId: string) => {
    setSavedPaperIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paperId)) {
        newSet.delete(paperId);
      } else {
        newSet.add(paperId);
      }
      return newSet;
    });
  };

  const isPaperSaved = (paperId: string) => savedPaperIds.has(paperId);

  // --- Value provided to consuming components ---
  const value = {
    prefs,
    savedPaperIds,
    loading,
    addInterest,
    removeInterest,
    addAuthor,
    removeAuthor,
    toggleExcludedCategory,
    toggleSavePaper,
    isPaperSaved,
    setPreferences,
  };

  return (
    <UserPrefsContext.Provider value={value}>
      {children}
    </UserPrefsContext.Provider>
  );
}

// --- Custom Hook: The "seamless" way to use the context ---
export function useUserPrefs() {
  const context = useContext(UserPrefsContext);
  if (context === undefined) {
    throw new Error("useUserPrefs must be used within a UserPrefsProvider");
  }
  return context;
}