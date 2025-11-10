import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import { ArxivPaper } from "@/types";

const ARXIV_BASE = "http://export.arxiv.org/api/query";

// Helper to safely extract text from XML parsed objects
function extractText(obj: any): string {
  // ... (same as before)
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  if (obj._) return obj._;
  if (Array.isArray(obj) && obj.length > 0) {
    return extractText(obj[0]);
  }
  return "";
}

// This function parses the XML response from arXiv
async function parseArxivResponse(xml: string): Promise<{ papers: ArxivPaper[], totalResults: number }> {
  const parsed = await parseStringPromise(xml);
  
  // Get total results for pagination
  const totalResults = parseInt(
    parsed.feed["opensearch:totalResults"]?.[0]?._ || "0"
  );

  if (!parsed.feed || !parsed.feed.entry) {
    return { papers: [], totalResults: 0 };
  }

  const entries = Array.isArray(parsed.feed.entry) 
    ? parsed.feed.entry 
    : [parsed.feed.entry];

  const papers = entries.map((entry: any): ArxivPaper => {
    // ... (same mapping logic as before)
    const authors = entry.author 
      ? (Array.isArray(entry.author) ? entry.author : [entry.author])
        .map((a: any) => extractText(a.name))
        .filter(Boolean)
      : [];

    const categories = entry.category
      ? (Array.isArray(entry.category) ? entry.category : [entry.category])
        .map((c: any) => c.$.term)
        .filter(Boolean)
      : [];

    const links = Array.isArray(entry.link) ? entry.link : [entry.link];
    const pdfLink = links.find((l: any) => l.$.title === "pdf");

    return {
      id: extractText(entry.id),
      title: extractText(entry.title).replace(/\s+/g, " ").trim(),
      authors,
      summary: extractText(entry.summary).replace(/\s+/g, " ").trim(),
      published: extractText(entry.published),
      updated: extractText(entry.updated),
      pdfUrl: pdfLink?.$.href || "",
      categories,
      primaryCategory: entry["arxiv:primary_category"]?.[0]?.$.term || categories[0],
      comment: extractText(entry["arxiv:comment"]),
      journalRef: extractText(entry["arxiv:journal_ref"]),
    };
  });

  return { papers, totalResults };
}

// The main GET handler for our API route
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    const url = `${ARXIV_BASE}?${params.toString()}`;

    const response = await fetch(url, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`arXiv API returned ${response.status}`);
    }

    const xml = await response.text();
    // Pass back the object with papers and totalResults
    const data = await parseArxivResponse(xml);

    return NextResponse.json(data);

  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: (error as Error).message }, 
      { status: 500 }
    );
  }
}