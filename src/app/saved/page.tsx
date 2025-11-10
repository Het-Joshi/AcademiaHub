"use client";
import { useState, useEffect } from "react";
import { ArxivPaper } from "@/types";
import PaperCard from "@/components/PaperCard";
// Import our new function
import { getPapersByIds } from "@/lib/arxiv";
import { useUserPrefs } from "@/context/UserPrefsContext"; // Import the hook

export default function SavedPapers() {
  const [savedPapers, setSavedPapers] = useState<ArxivPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const { savedPaperIds, loading: prefsLoading, toggleSavePaper } = useUserPrefs();
  useEffect(() => {
    // Don't run until the context has loaded IDs
    if (prefsLoading) {
      return;
    }
    loadSavedPapers();
  }, [savedPaperIds, prefsLoading]);

  const loadSavedPapers = async () => {
    setLoading(true);
    try {
      const ids = Array.from(savedPaperIds);
      if (ids.length === 0) {
        setSavedPapers([]);
        setLoading(false);
        return;
      }
      
      // --- LOGIC/PERFORMANCE FIX ---
      let papersFromCache: ArxivPaper[] = [];
      let idsToFetch: string[] = [];
      
      // 1. Try to load from the 'For You' page's cache
      const cached = localStorage.getItem("scholarly_papers_cache");
      if (cached) {
        const cachedPapers: ArxivPaper[] = JSON.parse(cached);
        const cacheMap = new Map(cachedPapers.map(p => [p.id, p]));
        
        for (const id of ids) {
          if (cacheMap.has(id)) {
            papersFromCache.push(cacheMap.get(id)!);
          } else {
            idsToFetch.push(id); // Paper not in cache, must fetch
          }
        }
      } else {
        idsToFetch = ids; // No cache, must fetch all
      }

      // 2. Fetch only the papers we couldn't find in the cache
      let papersFromApi: ArxivPaper[] = [];
      if (idsToFetch.length > 0) {
        papersFromApi = await getPapersByIds(idsToFetch);
      }
      
      // 3. Combine and set
      setSavedPapers([...papersFromCache, ...papersFromApi]);
      // --- END LOGIC/PERFORMANCE FIX ---

    } catch (error) {
      console.error("Failed to load saved papers:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    if (confirm("Are you sure you want to remove all saved papers?")) {
      // We just update the context, the page will react
      savedPaperIds.forEach(id => toggleSavePaper(id));
    }
  };

  if (loading || prefsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Loading saved papers...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Saved Papers</h1>
        {savedPapers.length > 0 && (
          <button
            onClick={clearAll}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {savedPapers.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No saved papers yet
          </h2>
          <p className="text-gray-600 mb-6">
            Start exploring and save papers you want to read later
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Search Papers
          </a>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-4">
            You have {savedPapers.length} saved paper{savedPapers.length !== 1 ? "s" : ""}
          </p>
          {/*
            PaperCard now gets its saved state from the context.
            We don't need to pass onSave or isSaved.
          */}
          {savedPapers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
            />
          ))}
        </div>
      )}
    </div>
  );
}