/* eslint-disable prefer-const */
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { searchArxiv } from "@/lib/arxiv";
import PaperCard from "@/components/PaperCard";
import UserPrefsComponent from "@/components/UserPrefs";
import { ArxivPaper, UserPrefs } from "@/types";
import { useUserPrefs } from "@/context/UserPrefsContext";

// Updated constants per user request
const FETCH_BATCH_SIZE = 50; 
const ITEMS_PER_PAGE = 10;

type SortByType = "submittedDate" | "relevance" | "lastUpdatedDate";

export default function ForYou() {
  const [allPapers, setAllPapers] = useState<ArxivPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [sortBy, setSortBy] = useState<SortByType>("submittedDate");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const { prefs, loading: prefsLoading } = useUserPrefs();

  // --- Sorting Logic ---
  // We prioritize followed authors when sorting by relevance
  const processPapers = useCallback((papers: ArxivPaper[], userPrefs: UserPrefs, sortMode: SortByType) => {
    let processed = [...papers];

    if (sortMode === 'relevance') {
       processed.sort((a, b) => {
         const aIsFollowed = a.authors.some(auth => userPrefs.followedAuthors.includes(auth));
         const bIsFollowed = b.authors.some(auth => userPrefs.followedAuthors.includes(auth));
         
         // 1. Followed authors first
         if (aIsFollowed && !bIsFollowed) return -1;
         if (!aIsFollowed && bIsFollowed) return 1;
         
         // 2. Then by date (newer first) as a tie-breaker
         return new Date(b.published).getTime() - new Date(a.published).getTime();
       });
    } else if (sortMode === 'submittedDate' || sortMode === 'lastUpdatedDate') {
       processed.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
    }

    return processed;
  }, []);

  // --- Main data fetching function ---
  const handlePrefsUpdate = useCallback(async (updatedPrefs: UserPrefs) => {
    // Reset to page 1 on new fetch
    setCurrentPage(1); 
    
    if (
      updatedPrefs.interests.length === 0 &&
      updatedPrefs.followedAuthors.length === 0
    ) {
      setAllPapers([]);
      setTotalResults(0);
      setLastUpdated(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queryParts: string[] = [];

      // Construct a broader query to get enough candidates for our custom sort
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

      // Fetch a larger batch (50) to allow for effective client-side sorting/pagination
      let { papers: results, totalResults: total } = await searchArxiv(
        fullQuery,
        FETCH_BATCH_SIZE, 
        0, // Start at 0, we paginate the batch locally
        sortBy // Pass sort to API too, though we refine locally
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
      
      // Apply Custom Sort (Author Priority)
      const sortedResults = processPapers(results, updatedPrefs, sortBy);

      setAllPapers(sortedResults);
      // Fix "0 recommended papers": ensure total is at least what we fetched
      setTotalResults(Math.max(total, sortedResults.length));
      setLastUpdated(new Date());

      // Cache for other pages
      localStorage.setItem("scholarly_papers_cache", JSON.stringify(sortedResults));

      if (sortedResults.length === 0) {
        setError("No papers found matching your preferences. Try adding more interests or authors.");
      }
    } catch (err) {
      setError("Failed to fetch papers. Please check your connection and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sortBy, processPapers]);

  // Wrap the updater to prevent loops
  const debouncedPrefsUpdate = useCallback((newPrefs: UserPrefs) => {
    handlePrefsUpdate(newPrefs);
  }, [handlePrefsUpdate]);
  
  // Initial Load
  useEffect(() => {
    if (!prefsLoading && (prefs.interests.length > 0 || prefs.followedAuthors.length > 0)) {
      handlePrefsUpdate(prefs);
    }
  }, [prefsLoading, sortBy]); // Removed 'prefs' dependency to avoid loop, relies on explicit user action or initial load

  // Re-sort if sort option changes (without re-fetching if possible, but for now we re-fetch to be safe with API sort)
  // Actually, we can just re-sort locally if we have papers, but `handlePrefsUpdate` fetches. 
  // Given the dependency above, it will re-fetch.

  const refreshFeed = useCallback(() => {
    handlePrefsUpdate(prefs);
  }, [prefs, handlePrefsUpdate]);
  
  // --- Client-Side Pagination Logic ---
  const totalPages = Math.ceil(allPapers.length / ITEMS_PER_PAGE);
  const visiblePapers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return allPapers.slice(start, start + ITEMS_PER_PAGE);
  }, [allPapers, currentPage]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">For You</h1>
          <p className="text-black">
            Personalized feed based on your interests and followed authors
          </p>
        </div>
        {allPapers.length > 0 && ( 
          <button
            onClick={refreshFeed}
            disabled={loading || prefsLoading}
            className="px-4 py-2 bg-stone-200 text-stone-800 rounded-md hover:bg-stone-300 disabled:opacity-50 transition-colors"
          >
            {loading ? "Refreshing..." : "🔄 Refresh Feed"}
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-1/3 lg:w-80 xl:w-96">
          <div className="sticky top-24">
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

          {loading || (prefsLoading && allPapers.length === 0) ? ( 
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mb-4"></div>
                <p className="text-gray-600">Loading your personalized feed...</p>
              </div>
            </div>
          ) : (
            <div>
              {allPapers.length > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-black">
                      {totalResults} Recommended Paper{totalResults !== 1 ? "s" : ""}
                    </h2>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortByType)}
                      className="glass-input !w-auto text-sm cursor-pointer"
                      disabled={loading}
                    >
                      <option value="submittedDate">Sort by Newest</option>
                      <option value="relevance">Sort by Author Relevance</option>
                      <option value="lastUpdatedDate">Sort by Last Updated</option>
                    </select>
                  </div>
                  
                  {lastUpdated && (
                    <div className="text-xs text-gray-500 mb-4 font-mono">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                  )}
                  
                  {/* Render visible slice */}
                  {visiblePapers.map((paper) => (
                    <PaperCard key={paper.id} paper={paper} />
                  ))}

                  {/* Pagination Controls */}
                  {allPapers.length > ITEMS_PER_PAGE && (
                    <div className="flex justify-center items-center gap-4 mt-8 pb-8">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 glass-card text-sm font-medium hover:bg-white/60 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← Previous
                      </button>
                      <span className="text-sm font-medium text-stone-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 glass-card text-sm font-medium hover:bg-white/60 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Add research interests or follow authors to see recommendations.
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