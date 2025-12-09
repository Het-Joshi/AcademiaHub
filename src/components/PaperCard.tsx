"use client";
import { ArxivPaper } from "@/types";
import { useState } from "react";
import { useUserPrefs } from "@/context/UserPrefsContext";

interface Props {
  paper: ArxivPaper;
}

export default function PaperCard({ paper }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { isPaperSaved, toggleSavePaper } = useUserPrefs();
  const saved = isPaperSaved(paper.id);

  // Clean ID logic...
  const getArxivId = (fullId: string) => fullId.replace(/^(https?:\/\/)?(www\.)?arxiv\.org\/abs\//, "").split('v')[0];
  const cleanId = getArxivId(paper.id);

  return (
    <div className="glass-card mb-4 group border-l-4 border-l-transparent hover:border-l-emerald-400">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-stone-800 leading-tight flex-1 pr-4 group-hover:text-emerald-700 transition-colors">
          {paper.title}
        </h3>
        <button
          onClick={() => toggleSavePaper(paper.id, paper.title)} // Pass Title Here
          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
            saved
              ? "bg-amber-100 text-amber-700 border-amber-300"
              : "bg-white/50 text-stone-500 border-stone-200 hover:bg-white hover:text-stone-700"
          }`}
        >
          {saved ? "★ Saved" : "Save"}
        </button>
      </div>

      <div className="text-sm text-emerald-700/80 mb-3 font-medium">
        {paper.authors.slice(0, 3).join(", ")}
        {paper.authors.length > 3 && <span className="opacity-60"> +{paper.authors.length - 3} more</span>}
      </div>

      <div className="flex items-center gap-3 text-xs text-stone-500 mb-4 font-mono">
        <span className="bg-stone-100 border border-stone-200 px-2 py-1 rounded">
            {paper.published.substring(0, 10)}
        </span>
        {paper.primaryCategory && (
          <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-200">
            {paper.primaryCategory}
          </span>
        )}
      </div>

      <div className="mb-5">
        <p className={`text-sm text-stone-600 leading-relaxed ${expanded ? "" : "line-clamp-3"}`}>
          {paper.summary}
        </p>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-emerald-600 hover:text-emerald-800 mt-2 font-medium uppercase tracking-wide hover:underline"
        >
          {expanded ? "Show less" : "Read abstract"}
        </button>
      </div>

      <div className="flex gap-3 pt-4 border-t border-stone-200/50">
        <a
          href={`/details/${cleanId}`}
          className="flex-1 text-center btn-primary py-2 text-sm shadow-md shadow-emerald-900/10"
        >
          Analysis & Discussion
        </a>
        <a
          href={paper.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-sm font-medium text-stone-600 bg-white/50 hover:bg-white border border-stone-200 rounded-lg transition-colors"
        >
          PDF
        </a>
      </div>
    </div>
  );
}