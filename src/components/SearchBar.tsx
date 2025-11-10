"use client";
import { useState, useEffect } from "react";
// Import advancedSearch instead of searchArxiv
import { advancedSearch, POPULAR_CATEGORIES } from "@/lib/arxiv";
import PaperCard from "./PaperCard";
import { ArxivPaper } from "@/types";

interface Props {
  initialQuery?: string;
}

export default function SearchBar({ initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  // Add state for the new author field
  const [author, setAuthor] = useState("");
  const [results, setResults] = useState<ArxivPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // No more local savedPapers state!

  const handleSearch = async () => {
    // Update validation
    if (!query.trim() && selectedCategories.length === 0 && !author.trim()) {
      setError("Please enter a search query, author, or select categories");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use advancedSearch instead of building a manual query string
      const papers = await advancedSearch({
        keywords: query.trim() || undefined,
        authors: author.trim() ? [author.trim()] : undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        maxResults: 20
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
    // Clear the new author field
    setAuthor("");
    setResults([]);
    setError(null);
  };

  return (
    <div className="mb-8">
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        {/* Main keyword search */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search by topic (e.g., network security) or title (ti:title)..."
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
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search by author (e.g., Devashish Gosain)"
            className="search-input"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors whitespace-nowrap"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {showFilters && (
          <div className="border-t pt-3">
            <h4 className="font-semibold mb-2 text-gray-700">Categories</h4>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(POPULAR_CATEGORIES).map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => toggleCategory(code)}
                    className={`text-left px-3 py-2 rounded border text-sm transition-colors ${
                      selectedCategories.includes(code)
                        ? "bg-blue-100 border-blue-300 text-blue-800 font-medium"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {name} ({code})
                  </button>
                ))}
            </div>
          </div>
        )}

        {(query || selectedCategories.length > 0 || author) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-800 mt-2"
          >
            Clear all
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Found {results.length} paper{results.length !== 1 ? "s" : ""}
            </h3>
          </div>
          {results.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              // No onSave or isSaved needed!
            />
          ))}
        </div>
      )}
    </div>
  );
}