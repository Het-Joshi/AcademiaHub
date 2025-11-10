"use client";
import { useState, useEffect } from "react";
import { UserPrefs } from "@/types";
import { POPULAR_CATEGORIES } from "@/lib/arxiv";
import { useUserPrefs } from "@/context/UserPrefsContext"; // Import the global context hook
import { useDebounce } from "@/hooks/useDebounce"; // Import the debounce hook

export default function UserPrefsComponent({
  onUpdate, // This prop is still needed for the 'For You' page to trigger a refresh
}: {
  onUpdate: (prefs: UserPrefs) => void;
}) {
  // --- Get ALL state and updaters from the global context ---
  const {
    prefs,
    addInterest,
    removeInterest,
    addAuthor,
    removeAuthor,
    toggleExcludedCategory,
  } = useUserPrefs();

  // --- Local state for inputs only ---
  const [newInterest, setNewInterest] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // --- LOGIC FIX: Debounce the preferences ---
  const debouncedPrefs = useDebounce(prefs, 500);

  // --- This effect now triggers the API call ---
  useEffect(() => {
    if (onUpdate) {
      onUpdate(debouncedPrefs);
    }
  }, [debouncedPrefs, onUpdate]); // Reacts to the "calm" prefs

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

  const handleKeyPress = (
    e: React.KeyboardEvent,
    action: () => void
  ) => {
    if (e.key === "Enter") {
      action();
    }
  };

  return (
    // --- STYLE CHANGE: Removed mb-8 ---
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Personalize Your Feed
      </h2>

      {/* Interests Section */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 text-gray-800">
          Research Interests
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Add topics you're interested in (e.g., "network security", "quantum computing")
        </p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleAddInterest)}
            placeholder="e.g., machine learning"
            className="search-input flex-1"
          />
          <button
            onClick={handleAddInterest}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>

        {prefs.interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {prefs.interests.map((interest) => (
              <div
                key={interest}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-800 rounded-full text-sm"
              >
                <span>{interest}</span>
                <button
                  onClick={() => removeInterest(interest)} // Use context updater
                  className="text-blue-600 hover:text-blue-800 font-bold"
                  aria-label={`Remove ${interest}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No interests added yet</p>
        )}
      </div>

      {/* Authors Section */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 text-gray-800">
          Follow Authors
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Get papers from specific researchers
        </p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleAddAuthor)}
            placeholder="e.g., Devashish Gosain"
            className="search-input flex-1"
          />
          <button
            onClick={handleAddAuthor}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Follow
          </button>
        </div>

        {prefs.followedAuthors.length > 0 ? (
          <div className="space-y-2">
            {prefs.followedAuthors.map((author) => (
              <div
                key={author}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <span className="text-sm text-gray-800">{author}</span>
                <button
                  onClick={() => removeAuthor(author)} // Use context updater
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Unfollow
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Not following any authors yet</p>
        )}
      </div>

      {/* Excluded Categories Section */}
      <div>
        <h3 className="font-semibold text-lg mb-3 text-gray-800">
          Exclude Categories
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Hide papers from certain research areas
        </p>
        <button
          onClick={() => setShowCategoryPicker(!showCategoryPicker)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors mb-3"
        >
          {showCategoryPicker ? "Hide Categories" : "Select Categories to Exclude"}
        </button>

        {showCategoryPicker && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            {Object.entries(POPULAR_CATEGORIES).map(([code, name]) => (
              <button
                key={code}
                onClick={() => toggleExcludedCategory(code)} // Use context updater
                className={`text-left px-3 py-2 rounded border transition-colors ${
                  prefs.excludedCategories?.includes(code)
                    ? "bg-red-50 border-red-300 text-red-800"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="text-sm font-medium">{code}</div>
                <div className="text-xs text-gray-600">{name}</div>
              </button>
            ))}
          </div>
        )}

        {prefs.excludedCategories && prefs.excludedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {prefs.excludedCategories.map((cat) => (
              <div
                key={cat}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-800 rounded-full text-sm"
              >
                <span>{cat}</span>
                <button
                  onClick={() => toggleExcludedCategory(cat)} // Use context updater
                  className="text-red-600 hover:text-red-800 font-bold"
                  aria-label={`Remove ${cat} from exclusions`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}