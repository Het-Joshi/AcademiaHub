// src/types/index.ts
export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  updated?: string;
  pdfUrl: string;
  categories: string[];
  primaryCategory?: string;
  comment?: string;
  journalRef?: string;
}

export interface UserPrefs {
  interests: string[];
  followedAuthors: string[];
  excludedCategories?: string[];
  // We remove savedPapers from here, as we are managing the IDs separately
  // in the context for clarity.
}

export interface FilterOptions {
  categories?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'relevance' | 'date' | 'citations';
}

export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content?: string | null;
}