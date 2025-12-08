// src/components/SearchBar.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { advancedSearch, POPULAR_CATEGORIES } from "@/lib/arxiv";
import PaperCard from "./PaperCard";
import { ArxivPaper } from "@/types";

type SortType = 'submittedDate' | 'relevance' | 'lastUpdatedDate';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params
  const initialQuery = searchParams.get("q") || "";
  const initialAuthor = searchParams.get("author") || "";
  const initialSort = (searchParams.get("sort") as SortType) || "submittedDate";
  const initialCats = searchParams.get("cats")?.split(",") || [];

  const [query, setQuery] = useState(initialQuery);
  const [author, setAuthor] = useState(initialAuthor);
  const [results, setResults] = useState<ArxivPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCats);
  const [sortBy, setSortBy] = useState<SortType>(initialSort);

  // Trigger search when URL params change
  useEffect(() => {
    const q = searchParams.get("q");
    const a = searchParams.get("author");
    const s = searchParams.get("sort") as SortType;
    const c = searchParams.get("cats");

    if (q || a || c) {
        performSearch(q || "", a || "", c?.split(",") || [], s || "submittedDate");
    }
  }, [searchParams]);

  const performSearch = async (q: string, a: string, cats: string[], sort: SortType) => {
    setLoading(true);
    setError(null);
    try {
      const papers = await advancedSearch({
        keywords: q.trim() || undefined,
        authors: a.trim() ? [a.trim()] : undefined,
        categories: cats.length > 0 ? cats : undefined,
        maxResults: 20,
        sortBy: sort
      });
      setResults(papers.length > 0 ? papers : []);
      if (papers.length === 0) setError("No papers found.");
    } catch (err) {
      setError("Failed to fetch papers.");
    } finally {
      setLoading(false);
    }
  };

  const updateUrl = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (author) params.set("author", author);
    if (selectedCategories.length > 0) params.set("cats", selectedCategories.join(","));
    params.set("sort", sortBy);
    router.push(`/?${params.toString()}`);
  };

  const handleSearch = () => {
    if (!query && !author && selectedCategories.length === 0) return;
    updateUrl();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  // ... Render logic remains mostly the same, ensuring inputs bind to state ...
  // Ensure the "Search" button calls handleSearch

  return (
    <div className="mb-8">
      {/* Search Inputs Container */}
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-4">
             <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search papers..."
                className="glass-input text-2xl py-4"
              />
        </div>
        {/* Author Input */}
        <div className="relative mb-4">
             <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search by author..."
                className="glass-input text-2xl py-4"
              />
        </div>

        <div className="flex justify-center gap-3 mb-4">
            <button onClick={handleSearch} disabled={loading} className="btn-primary px-8 py-3">
                {loading ? "Searching..." : "Search"}
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className="px-6 py-3 bg-white/50 rounded-lg border border-stone-200">
                Filters {selectedCategories.length > 0 && `(${selectedCategories.length})`}
            </button>
        </div>

        {/* Filters Panel (Categories & Sort) */}
        {showFilters && (
            <div className="glass-card mb-6 p-4">
                <div className="mb-4">
                    <label className="font-bold block mb-2">Sort By</label>
                    <div className="flex gap-2">
                        {(['submittedDate', 'relevance', 'lastUpdatedDate'] as SortType[]).map(t => (
                            <button key={t} onClick={() => setSortBy(t)} 
                                className={`px-3 py-1 rounded ${sortBy === t ? 'bg-emerald-600 text-white' : 'bg-stone-200'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(POPULAR_CATEGORIES).map(([code, name]) => (
                        <button key={code} onClick={() => toggleCategory(code)}
                            className={`text-left text-xs p-2 rounded ${selectedCategories.includes(code) ? 'bg-emerald-100 border-emerald-500 border' : 'bg-white/50'}`}>
                            {name}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>

      {error && <div className="text-center text-red-600 my-4">{error}</div>}
      
      <div className="mt-8">
        {results.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
        ))}
      </div>
    </div>
  );
}