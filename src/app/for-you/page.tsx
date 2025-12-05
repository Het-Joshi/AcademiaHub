/* eslint-disable prefer-const */
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { searchArxiv } from "@/lib/arxiv";
import PaperCard from "@/components/PaperCard";
import UserPrefsComponent from "@/components/UserPrefs";
import { ArxivPaper, UserPrefs } from "@/types";
import { useUserPrefs } from "@/context/UserPrefsContext";

// Config: Fetch more papers per specific interest to build a good pool
const PER_CATEGORY_FETCH_LIMIT = 25; 
const ITEMS_PER_PAGE = 10;

type SortByType = "submittedDate" | "relevance" | "lastUpdatedDate";

export default function ForYou() {
  // Store the raw pool of fetched papers here
  const [rawPapers, setRawPapers] = useState<ArxivPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // UI State
  const [sortBy, setSortBy] = useState<SortByType>("submittedDate");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Context
  const { prefs, loading: prefsLoading } = useUserPrefs();

  // --- 1. Data Fetching Logic ---
  // We fetch specific batches for each interest/author to guarantee representation
  const fetchPersonalizedFeed = useCallback(async (currentPrefs: UserPrefs) => {
    if (
      currentPrefs.interests.length === 0 &&
      currentPrefs.followedAuthors.length === 0
    ) {
      setRawPapers([]);
      setLastUpdated(null);
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      // We will collect promises for all fetches
      const fetchPromises: Promise<{ papers: ArxivPaper[] } | null>[] = [];

      // A. Fetch for Each Followed Author (High Priority)
      // We ask for 'submittedDate' (newest) to ensure we get their latest work
      currentPrefs.followedAuthors.forEach(author => {
        fetchPromises.push(
          searchArxiv(`au:"${author}"`, PER_CATEGORY_FETCH_LIMIT, 0, 'submittedDate')
            .catch(err => {
              console.warn(`Failed to fetch for author: ${author}`, err);
              return null;
            })
        );
      });

      // B. Fetch for Each Interest
      currentPrefs.interests.forEach(interest => {
        fetchPromises.push(
          searchArxiv(`all:"${interest}"`, PER_CATEGORY_FETCH_LIMIT, 0, 'submittedDate')
            .catch(err => {
              console.warn(`Failed to fetch for interest: ${interest}`, err);
              return null;
            })
        );
      });

      // C. Execute all requests in parallel
      const results = await Promise.all(fetchPromises);

      // D. De-duplicate and Merge
      const uniquePapers = new Map<string, ArxivPaper>();
      
      results.forEach(result => {
        if (result && result.papers) {
          result.papers.forEach(p => {
            // Use ID as key to prevent duplicates
            if (!uniquePapers.has(p.id)) {
              uniquePapers.set(p.id, p);
            }
          });
        }
      });

      let pool = Array.from(uniquePapers.values());

      // E. Filter Excluded Categories
      if (currentPrefs.excludedCategories && currentPrefs.excludedCategories.length > 0) {
        pool = pool.filter(paper => 
          !paper.categories.some(cat => currentPrefs.excludedCategories?.includes(cat))
        );
      }

      setRawPapers(pool);
      setLastUpdated(new Date());
      localStorage.setItem("scholarly_papers_cache", JSON.stringify(pool));

      if (pool.length === 0) {
        setError("No papers found. Try adding different interests or authors.");
      }

    } catch (err) {
      setError("Failed to generate feed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []); // Stable dependency

  // --- 2. Sorting Logic (Client-Side) ---
  const sortedPapers = useMemo(() => {
    let processed = [...rawPapers];

    if (sortBy === 'relevance') {
       // Custom Relevance: Followed Authors -> Newest
       processed.sort((a, b) => {
         const aIsFollowed = a.authors.some(auth => prefs.followedAuthors.includes(auth));
         const bIsFollowed = b.authors.some(auth => prefs.followedAuthors.includes(auth));
         
         // Priority 1: Followed Authors
         if (aIsFollowed && !bIsFollowed) return -1;
         if (!aIsFollowed && bIsFollowed) return 1;
         
         // Priority 2: Publish Date
         return new Date(b.published).getTime() - new Date(a.published).getTime();
       });
    } else {
       // Standard Date Sorts
       processed.sort((a, b) => {
         const dateA = new Date(sortBy === 'lastUpdatedDate' ? a.updated || a.published : a.published);
         const dateB = new Date(sortBy === 'lastUpdatedDate' ? b.updated || b.published : b.published);
         return dateB.getTime() - dateA.getTime();
       });
    }

    return processed;
  }, [rawPapers, sortBy, prefs.followedAuthors]);

  // --- 3. Pagination Logic ---
  const totalPages = Math.ceil(sortedPapers.length / ITEMS_PER_PAGE);
  const visiblePapers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedPapers.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedPapers, currentPage]);

  // --- 4. Effects ---
  
  // Initial Fetch & Prefs Change
  const debouncedPrefsUpdate = useCallback((newPrefs: UserPrefs) => {
    fetchPersonalizedFeed(newPrefs);
  }, [fetchPersonalizedFeed]);

  // Trigger fetch on mount or when prefs finish loading (if we have data)
  useEffect(() => {
    if (!prefsLoading && (prefs.interests.length > 0 || prefs.followedAuthors.length > 0)) {
        // Simple check to avoid double-fetching if we already have data in memory 
        // (Optional: remove rawPapers.length check if you want live updates on every nav)
        if (rawPapers.length === 0) {
            fetchPersonalizedFeed(prefs);
        }
    }
  }, [prefsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshFeed = () => fetchPersonalizedFeed(prefs);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">For You</h1>
          <p className="text-black">
            Aggregating papers from your {prefs.followedAuthors.length} authors and {prefs.interests.length} topics.
          </p>
        </div>
        {(rawPapers.length > 0 || loading) && ( 
          <button
            onClick={refreshFeed}
            disabled={loading || prefsLoading}
            className="px-4 py-2 bg-stone-200 text-stone-800 rounded-md hover:bg-stone-300 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {loading ? "Fetching..." : "🔄 Refresh Feed"}
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-1/3 lg:w-80 xl:w-96">
          <div className="sticky top-24">
            {/* Pass the debounced updater */}
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

          {loading ? ( 
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mb-4"></div>
                <p className="text-gray-600">Curating your personalized feed...</p>
                <p className="text-xs text-gray-400 mt-2">Fetching papers from arXiv...</p>
              </div>
            </div>
          ) : (
            <div>
              {sortedPapers.length > 0 ? (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-semibold text-black">
                      {sortedPapers.length} Recommended Papers
                    </h2>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Sort by:</label>
                        <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortByType)}
                        className="glass-input !w-auto text-sm cursor-pointer py-1"
                        >
                        <option value="submittedDate">Newest</option>
                        <option value="relevance">Author Relevance</option>
                        <option value="lastUpdatedDate">Last Updated</option>
                        </select>
                    </div>
                  </div>
                  
                  {lastUpdated && (
                    <div className="text-xs text-gray-500 mb-4 font-mono text-right">
                      Updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {visiblePapers.map((paper) => (
                        <PaperCard key={paper.id} paper={paper} />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {sortedPapers.length > ITEMS_PER_PAGE && (
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
                !error && ( 
                  <div className="glass-card p-12 text-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">
                      Start Your Research Journey
                    </h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Add research interests (e.g., "Machine Learning") or follow specific authors in the sidebar to populate your feed.
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