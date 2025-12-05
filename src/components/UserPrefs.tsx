"use client";
import { useState, useEffect } from "react";
import { UserPrefs } from "@/types";
import { useUserPrefs } from "@/context/UserPrefsContext";
import { useDebounce } from "@/hooks/useDebounce";

export default function UserPrefsComponent({ onUpdate }: { onUpdate: (prefs: UserPrefs) => void }) {
  const { prefs, addInterest, removeInterest, addAuthor, removeAuthor } = useUserPrefs();
  const [newInterest, setNewInterest] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const debouncedPrefs = useDebounce(prefs, 500);

  useEffect(() => {
    if (onUpdate) onUpdate(debouncedPrefs);
  }, [debouncedPrefs, onUpdate]);

  const handleAddInterest = () => {
    const trimmed = newInterest.trim().toLowerCase();
    if (trimmed) {
      addInterest(trimmed); // Use context updater
      setNewInterest("");
    }
  };

  const handleAddAuthor = () => {
    const trimmed = newAuthor.trim();
    if (trimmed) {
      addAuthor(trimmed); // Use context updater
      setNewAuthor("");
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    action: () => void
  ) => {
    if (e.key === "Enter") {
      action();
    }
  };

  return (
    <div className="glass-card">
      <h2 className="text-xl font-bold mb-1 text-black">Focus Your Feed</h2>
      <p className="text-xs text-gray-400 mb-6">Customize what you see in the cosmos.</p>

      {/* Interests */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
          Research Topics
        </label>
        <div className="relative mb-3">
          <input
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleAddInterest)}
            placeholder="e.g., machine learning"
            className="search-input flex-1"
          />
          <button 
            onClick={() => { addInterest(newInterest); setNewInterest(""); }}
            className="absolute right-2 top-1.5 text-blue-400 hover:text-black"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {prefs.interests.map((tag) => (
            <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 border border-blue-500/30 text-black-700 text-xs rounded-md">
              {tag}
              <button onClick={() => removeInterest(tag)} className="hover:text-black ml-1">×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Authors */}
      <div>
        <label className="block text-xs font-semibold text-purple-900 uppercase tracking-wider mb-2">
          Authors
        </label>
        <div className="relative mb-3">
          <input
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleAddAuthor)}
            placeholder="e.g., Devashish Gosain"
            className="search-input flex-1"
          />
          <button 
            onClick={() => { addAuthor(newAuthor); setNewAuthor(""); }}
            className="absolute right-2 top-1.5 text-purple-1200 hover:text-black"
          >
            +
          </button>
        </div>
        <div className="space-y-1">
          {prefs.followedAuthors.map((author) => (
            <div key={author} className="flex justify-between items-center px-3 py-2 bg-pink-600/20 border border-purple-500/20 rounded text-sm text-black-700">
              <span>{author}</span>
              <button onClick={() => removeAuthor(author)} className="text-xs opacity-50 hover:opacity-100">Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}