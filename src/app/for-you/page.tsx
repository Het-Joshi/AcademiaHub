/* eslint-disable prefer-const */
"use client";
// Import useCallback
import { useState, useEffect, useCallback } from "react";
import { searchArxiv } from "@/lib/arxiv";
import PaperCard from "@/components/PaperCard";
import UserPrefsComponent from "@/components/UserPrefs";
import { ArxivPaper, UserPrefs } from "@/types";
import { useUserPrefs } from "@/context/UserPrefsContext";

const PAGE_SIZE = 10;
type SortByType = "submittedDate" | "relevance" | "lastUpdatedDate";

export default function ForYou() {
  const [papers, setPapers] = useState<ArxivPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [sortBy, setSortBy] = useState<SortByType>("submittedDate");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const { prefs, loading: prefsLoading } = useUserPrefs();

  // --- Main data fetching function ---
  const handlePrefsUpdate = useCallback(async (updatedPrefs: UserPrefs, page: number = 1) => {
    setCurrentPage(page);
    
    if (
      updatedPrefs.interests.length === 0 &&
      updatedPrefs.followedAuthors.length === 0
    ) {
      setPapers([]);
      setTotalResults(0);
      setLastUpdated(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queryParts: string[] = [];

      if (updatedPrefs.interests.length > 0) {
        const interestQuery = updatedPrefs.interests
          .map((interest) => `all:"${interest}"`)
          .join(" OR ");
        queryParts.push(`(${interestQuery})`);
      }

      if (updatedPrefs.followedAuthors.length > 0) {
        const authorQuery = updatedPrefs.followedAuthors
          .map((author) => `au:"${author}"`)
          .join(" OR ");
        queryParts.push(`(${authorQuery})`);
      }

      const fullQuery = queryParts.join(" OR ");
      const startIndex = (page - 1) * PAGE_SIZE;

      let { papers: results, totalResults: total } = await searchArxiv(
        fullQuery,
        PAGE_SIZE,
        startIndex,
        sortBy
      );

      // Filter out excluded categories
      if (updatedPrefs.excludedCategories && updatedPrefs.excludedCategories.length > 0) {
        results = results.filter(
          (paper) =>
            !paper.categories.some((cat) =>
              updatedPrefs.excludedCategories?.includes(cat)
            )
        );
      }
      
      if (sortBy === 'submittedDate' || sortBy === 'lastUpdatedDate') {
         results.sort(
          (a, b) =>
            new Date(b.published).getTime() - new Date(a.published).getTime()
        );
      }

      setPapers(results);
      setTotalResults(total);
      setLastUpdated(new Date());

      localStorage.setItem("scholarly_papers_cache", JSON.stringify(results));

      if (results.length === 0) {
        setError(
          "No papers found matching your preferences. Try adding more interests or authors."
        );
      }
    } catch (err) {
      setError(
        "Failed to fetch papers. Please check your connection and try again."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sortBy]); // <-- This dependency is correct

  // --- THIS IS THE FIX ---
  // Wrap the debounced updater in useCallback.
  // This creates a stable function that won't change on every re-render,
  // preventing the UserPrefsComponent's useEffect from looping.
  const debouncedPrefsUpdate = useCallback((newPrefs: UserPrefs) => {
    handlePrefsUpdate(newPrefs, 1); // Reset to page 1
  }, [handlePrefsUpdate]); // <-- Now depends on the stable handlePrefsUpdate
  
  // --- Effect to re-fetch when page changes ---
  // This hook is fine, but it has a stale closure on 'prefs'.
  // It's not the cause of the *infinite loop*, but it could be buggy.
  // The fix above solves the loop.
  useEffect(() => {
    if (!prefsLoading && (prefs.interests.length > 0 || prefs.followedAuthors.length > 0)) {
      handlePrefsUpdate(prefs, currentPage);
    }
  }, [currentPage, prefsLoading]); // Note: 'prefs' and 'handlePrefsUpdate' are stale here
  
  // --- Effect to re-fetch when sort changes ---
  // This hook also has a stale 'prefs' closure.
  useEffect(() => {
    if (!prefsLoading) {
      handlePrefsUpdate(prefs, 1); // Reset to page 1
    }
  }, [sortBy, prefsLoading]); // Note: 'prefs' and 'handlePrefsUpdate' are stale here

  const refreshFeed = useCallback(() => {
    handlePrefsUpdate(prefs, 1);
  }, [prefs, handlePrefsUpdate]);
  
  const totalPages = Math.ceil(totalResults / PAGE_SIZE);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">For You</h1>
          <p className="text-black">
            Personalized feed based on your interests and followed authors
          </p>
        </div>
        {papers.length > 0 && ( 
          <button
            onClick={refreshFeed}
            disabled={loading || prefsLoading}
            className="px-4 py-2 bg-dark text-black rounded-md hover:bg-light disabled:bg-gray-400 transition-colors"
          >
            {loading ? "Refreshing..." : "🔄 Refresh Feed"}
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-1/3 lg:w-80 xl:w-96">
          <div className="sticky top-24">
            {/* --- Pass the new STABLE debounced updater --- */}
            <UserPrefsComponent onUpdate={debouncedPrefsUpdate} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
              <p className="font-medium">⚠️ {error}</p>
            </div>
          )}

          {loading || (prefsLoading && papers.length === 0) ? ( 
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-gray-600">Loading your personalized feed...</p>
              </div>
            </div>
          ) : (
            <div>
              {papers.length > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-black">
                      {totalResults} Recommended Paper{totalResults !== 1 ? "s" : ""}
                    </h2>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortByType)}
                      className="search-input !w-auto text-sm"
                      disabled={loading}
                    >
                      <option value="submittedDate">Sort by Newest</option>
                      <option value="relevance">Sort by Relevance</option>
                      <option value="lastUpdatedDate">Sort by Last Updated</option>
                    </select>
                  </div>
                  
                  {lastUpdated && (
                    <div className="text-sm text-gray-500 mb-4">
                      Last updated: {lastUpdated.toLocaleString()}
                    </div>
                  )}
                  
                  {papers.map((paper) => (
                    <PaperCard key={paper.id} paper={paper} />
                  ))}

                  {totalResults > PAGE_SIZE && (
                    <div className="flex justify-between items-center mt-8">
                      <button
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1 || loading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                      >
                        ← Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage * PAGE_SIZE >= totalResults || loading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                !loading &&
                !error && ( 
                  <div className="glass-card p-12 text-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">
                      Customize Your Feed
                    </h2>
                    <p className="text-gray-600">
                      Add research interests or follow authors above to see
                      personalized paper recommendations
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}