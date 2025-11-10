// lib/arxiv.ts
import { ArxivPaper } from "@/types";

// This is our internal API route, not the external arXiv URL
const API_BASE = "/api/arxiv";

// Helper function to extract the plain ID from the full arXiv URL
function getPlainArxivId(fullId: string): string {
  // ... (same as before)
  try {
    const url = new URL(fullId);
    const pathParts = url.pathname.split('/');
    const idWithVersion = pathParts[pathParts.length - 1];
    return idWithVersion.split('v')[0];
  } catch (e) {
    return fullId.split('v')[0];
  }
}

// Base fetcher for our internal API
async function fetchFromApi(params: URLSearchParams): Promise<{ papers: ArxivPaper[], totalResults: number }> {
  try {
    const url = `${API_BASE}?${params.toString()}`;
    const response = await fetch(url); 

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `API route returned ${response.status}`);
    }

    // Expecting { papers: ArxivPaper[], totalResults: number }
    const data: { papers: ArxivPaper[], totalResults: number } = await response.json();
    return data;
  } catch (error) {
    console.error("arXiv lib error:", error);
    return { papers: [], totalResults: 0 }; // Return empty on failure
  }
}

// Fetch and parse arXiv papers
export async function searchArxiv(
  query: string, 
  maxResults = 10,
  startIndex = 0,
  sortBy: 'submittedDate' | 'relevance' | 'lastUpdatedDate' = 'submittedDate'
): Promise<{ papers: ArxivPaper[], totalResults: number }> {
  const params = new URLSearchParams({
    search_query: query,
    start: startIndex.toString(),
    max_results: maxResults.toString(),
    sortBy: sortBy,
    sortOrder: "descending"
  });
  return fetchFromApi(params);
}

// Get specific papers by their IDs
export async function getPapersByIds(
  fullIds: string[]
): Promise<ArxivPaper[]> {
  if (fullIds.length === 0) {
    return [];
  }
  const plainIds = fullIds.map(getPlainArxivId).join(',');
  
  const params = new URLSearchParams({
    id_list: plainIds,
    max_results: fullIds.length.toString()
  });
  // This function only needs the papers, not the total
  const { papers } = await fetchFromApi(params);
  return papers;
}

// Helper for security news (cs.CR category)
export async function getSecurityNews(maxResults = 15): Promise<ArxivPaper[]> {
  const { papers } = await searchArxiv("cat:cs.CR", maxResults);
  return papers;
}

// Get papers by specific categories
export async function getPapersByCategories(
  categories: string[], 
  maxResults = 20
): Promise<ArxivPaper[]> {
  const query = categories.map(cat => `cat:${cat}`).join(" OR ");
  const { papers } = await searchArxiv(query, maxResults);
  return papers;
}

// Search with multiple filters
export async function advancedSearch(params: {
  keywords?: string;
  authors?: string[];
  categories?: string[];
  title?: string;
  maxResults?: number;
}): Promise<ArxivPaper[]> {
  const queryParts: string[] = [];

  if (params.keywords) {
    queryParts.push(`all:"${params.keywords}"`);
  }
  if (params.authors && params.authors.length > 0) {
    const authorQuery = params.authors.map(a => `au:"${a}"`).join(" OR ");
    queryParts.push(`(${authorQuery})`);
  }
  if (params.categories && params.categories.length > 0) {
    const catQuery = params.categories.map(c => `cat:${c}`).join(" OR ");
    queryParts.push(`(${catQuery})`);
  }
  if (params.title) {
    queryParts.push(`ti:"${params.title}"`);
  }

  const fullQuery = queryParts.join(" AND ");
  const { papers } = await searchArxiv(fullQuery, params.maxResults || 20);
  return papers;
}

// Popular arXiv categories for easy access
export const POPULAR_CATEGORIES = {
  // ... (same as before)
  "cs.AI": "Artificial Intelligence",
  "cs.LG": "Machine Learning",
  "cs.CL": "Computation and Language",
  "cs.CV": "Computer Vision",
  "cs.CR": "Cryptography and Security",
  "cs.DB": "Databases",
  "cs.DC": "Distributed Computing",
  "cs.NE": "Neural and Evolutionary Computing",
  "stat.ML": "Machine Learning (Stats)",
  "math.CO": "Combinatorics",
  "physics.comp-ph": "Computational Physics",
  "q-bio.QM": "Quantitative Methods",
};