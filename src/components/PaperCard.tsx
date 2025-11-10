"use client";
import { ArxivPaper } from "@/types";
import { useState } from "react";
import { useUserPrefs } from "@/context/UserPrefsContext"; // Import the hook

interface Props {
  paper: ArxivPaper;

}

export default function PaperCard({ paper }: Props) {
  const [expanded, setExpanded] = useState(false);
  
  // Get what we need from the context
  const { isPaperSaved, toggleSavePaper } = useUserPrefs();
  
  // The card's saved state is now derived directly from the global context
  const saved = isPaperSaved(paper.id);

  const handleSave = () => {
    // Just call the context updater. That's it!
    toggleSavePaper(paper.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  };

  const getArxivId = (fullId: string) => {
    // Extract arxiv ID from full URL
    const match = fullId.match(/(\d+\.\d+)/);
    return match ? match[1] : fullId;
  };

  return (
  <div className="paper-card hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4">
          {paper.title}
        </h3>
        <button
          onClick={handleSave}
          className={`flex-shrink-0 px-3 py-1 rounded text-sm ${
            saved
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          aria-label={saved ? "Unsave paper" : "Save paper"}
        >
          {saved ? "★ Saved" : "☆ Save"}
        </button>
      </div>

      <div className="text-sm text-gray-600 mb-2">
        <span className="font-medium">Authors:</span>{" "}
        {paper.authors.length > 3 ? (
          <>
            {paper.authors.slice(0, 3).join(", ")}
            <span className="text-gray-500"> (+{paper.authors.length - 3} more)</span>
          </>
        ) : (
          paper.authors.join(", ")
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
        <span>📅 {formatDate(paper.published)}</span>
        {paper.primaryCategory && (
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
            {paper.primaryCategory}
          </span>
        )}
        <span className="text-xs text-gray-400">
          ID: {getArxivId(paper.id)}
        </span>
      </div>

      <div className="mb-4">
        <p className={`text-sm text-gray-700 ${expanded ? "" : "line-clamp-3"}`}>
          {paper.summary}
        </p>
        {paper.summary.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-600 hover:text-blue-800 mt-1"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {paper.comment && (
        <div className="text-xs text-gray-500 mb-3 italic">
          Note: {paper.comment}
        </div>
      )}

      {paper.journalRef && (
        <div className="text-xs text-gray-500 mb-3">
          <span className="font-medium">Published in:</span> {paper.journalRef}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        {paper.pdfUrl && (
          <a
            href={paper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
          >
            📄 View PDF
          </a>
        )}
        <a
          href={`https://arxiv.org/abs/${getArxivId(paper.id)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          View on arXiv →
        </a>
        {paper.categories.length > 1 && (
          <div className="flex flex-wrap gap-1 ml-auto">
            {paper.categories.slice(1, 4).map((cat) => (
              <span
                key={cat}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
              >
                {cat}
              </span>
            ))}
            {paper.categories.length > 4 && (
              <span className="text-xs text-gray-400">
                +{paper.categories.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}