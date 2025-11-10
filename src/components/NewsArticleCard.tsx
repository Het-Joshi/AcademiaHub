// src/components/NewsArticleCard.tsx
"use client";
import { NewsArticle } from "@/types";

interface Props {
  article: NewsArticle;
}

// Helper to format dates
const formatDate = (dateString: string) => {
  // ... (same as before)
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Helper to get a clean source URL
const getHostName = (url: string) => {
  // ... (same as before)
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (e) {
    return url;
  }
};

export default function NewsArticleCard({ article }: Props) {
  return (
    // --- STYLES MODIFIED FOR TILE ---
    // Changed to always be flex-col, added h-full for grid
    <div className="paper-card hover:shadow-lg transition-shadow flex flex-col gap-4 h-full">
      {article.urlToImage && (
        <div className="flex-shrink-0">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <img
              src={article.urlToImage}
              alt={article.title}
              // --- Fixed height image ---
              className="rounded-lg object-cover w-full h-48"
            />
          </a>
        </div>
      )}

      {/* --- Added flex-1 and flex-col to make content fill space --- */}
      <div className="flex-1 flex flex-col">
        <div className="text-sm text-gray-600 mb-2 flex items-center">
          <span>{article.source.name || getHostName(article.url)}</span>
          <span className="mx-2">•</span>
          <span>{formatDate(article.publishedAt)}</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-3 hover:text-blue-700">
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            {article.title}
          </a>
        </h3>

        <p className="text-sm text-gray-700 mb-4 line-clamp-3">
          {article.description}
        </p>
        
        {article.author && (
           <div className="text-xs text-gray-500 mb-4">
             By: {article.author.length > 50 ? `${article.author.slice(0, 50)}...` : article.author}
           </div>
        )}

        {/* --- Added mt-auto to push button to bottom --- */}
        <div className="flex items-center mt-auto">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
          >
            Read Full Article →
          </a>
        </div>
      </div>
    </div>
  );
}