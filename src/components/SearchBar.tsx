// src/components/SearchBar.tsx
"use client";
import { useState } from "react";
import { advancedSearch, POPULAR_CATEGORIES } from "@/lib/arxiv";
import PaperCard from "./PaperCard";
import { ArxivPaper } from "@/types";

interface Props {
  initialQuery?: string;
}

// Define valid sort types
type SortType = 'submittedDate' | 'relevance' | 'lastUpdatedDate';

export default function SearchBar({ initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [author, setAuthor] = useState("");
  const [results, setResults] = useState<ArxivPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // New State for Sorting
  const [sortBy, setSortBy] = useState<SortType>('submittedDate');

  const handleSearch = async () => {
    if (!query.trim() && selectedCategories.length === 0 && !author.trim()) {
      setError("Please enter a search query, author, or select categories");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const papers = await advancedSearch({
        keywords: query.trim() || undefined,
        authors: author.trim() ? [author.trim()] : undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        maxResults: 20,
        sortBy: sortBy // Pass the sort state
      });
      
      if (papers.length === 0) {
        setError("No papers found. Try different search terms.");
      }
      
      setResults(papers);
    } catch (err) {
      setError("Failed to fetch papers. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setQuery("");
    setAuthor("");
    setSortBy('submittedDate'); // Reset sort
    setResults([]);
    setError(null);
  };

  return (
    <div className="mb-8">
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        {/* Main keyword search */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by topic (e.g., network security) or title ..."
            className="search-input"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            {showFilters ? "Hide Filters" : "Filters"}
          </button>
        </div>

        {/* New Author Field (can be shown always or with filters) */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by author (e.g., Devashish Gosain)"
            className="search-input"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-10 py-4 bg-gradient-to-r from-rose-400 to-rose-500 text-white text-lg font-medium rounded-xl shadow-lg hover:from-rose-500 hover:to-rose-600 hover:shadow-xl disabled:from-gray-300 disabled:to-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? "Searching..." : "Search Papers"}
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 text-lg font-medium rounded-xl border-2 border-gray-200 shadow-md hover:bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
             {/* Filter Icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? "Hide Filters" : "Filters"}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-gray-100 shadow-lg p-6 mb-4">
            
            {/* NEW: Sort Section */}
            <div className="mb-6 border-b border-gray-200 pb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Sort By
              </h4>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'submittedDate', label: 'Newest' },
                  { value: 'relevance', label: 'Relevance' },
                  { value: 'lastUpdatedDate', label: 'Last Updated' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as SortType)}
                    className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                      sortBy === option.value
                        ? "bg-rose-100 border-2 border-rose-300 text-rose-800 font-medium shadow-sm"
                        : "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Existing Categories Section */}
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Categories
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(POPULAR_CATEGORIES).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => toggleCategory(code)}
                  className={`text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    selectedCategories.includes(code)
                      ? "bg-rose-100 border-2 border-rose-300 text-rose-800 font-medium shadow-sm"
                      : "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <span className="font-medium">{name}</span>
                  <span className="text-xs text-gray-500 ml-1">({code})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clear All */}
        {(query || selectedCategories.length > 0 || author || sortBy !== 'submittedDate') && (
          <div className="text-center">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-rose-500 transition-colors inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ... (Error and Results display remains the same) ... */}
      {error && (
        <div className="max-w-4xl mx-auto mt-6 bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
             {/* ... */}
             {error}
        </div>
      )}

      {results.length > 0 && (
         <div className="mt-8">
            {/* ... Results mapping ... */}
            {results.map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
            ))}
         </div>
      )}
    </div>
  );
}