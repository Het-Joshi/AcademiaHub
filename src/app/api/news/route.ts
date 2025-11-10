// src/app/api/news/route.ts
import { NextResponse } from "next/server";
import { NewsArticle } from "@/types";
import Parser from "rss-parser";

// --- DEFINE YOUR RSS FEEDS HERE ---
const FEEDS = [
  // ... (same as before)
  { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { name: "MIT News (ML)", url: "https://news.mit.edu/rss/topic/machine-learning" },
  { name: "ScienceDaily (AI)", url: "https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage" },
  { name: "Ars Technica", url: "https://arstechnica.com/feed/" },
  { name: "Synced (AI News)", url: "https://syncedreview.com/feed/" }
];

// --- Keywords for filtering tabs ---
const TOPIC_KEYWORDS: { [key: string]: string[] } = {
  "AI": ["artificial intelligence", "ai", "machine learning", "ml", "llm", "large language model"],
  "Security": ["security", "cybersecurity","vulnerability", "breach", "ransomware", "malware"],
  "Open-Source": ["open source", "open-source", "foss", "linux", "github"],
  "Systems": ["distributed systems", "operating systems", "systems design", "cloud computing", "kubernetes"],
};

const parser = new Parser();

// --- Helper function to check for topics ---
function containsTopics(text: string, topics: string[]): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return topics.some(topic => lowerText.includes(topic.toLowerCase()));
}

// Main GET handler for our API route
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic'); // e.g., "AI", "Security"
    const keywords = topic ? TOPIC_KEYWORDS[topic] : null;

    // Fetch all feeds in parallel
    const feedPromises = FEEDS.map(async (feed) => {
      // ... (same fetch logic)
      try {
        const parsedFeed = await parser.parseURL(feed.url);
        return {
          sourceName: feed.name,
          items: parsedFeed.items
        };
      } catch (error) {
        console.warn(`Failed to fetch RSS feed: ${feed.name}`, error);
        return { sourceName: feed.name, items: [] }; // Return empty on failure
      }
    });

    const results = await Promise.allSettled(feedPromises);

    let allArticles: NewsArticle[] = [];

    // Process results
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        const { sourceName, items } = result.value;
        
        // Filter and normalize articles
        const filteredItems = items
          // --- Apply topic filter if keywords are provided ---
          .filter(item => 
            !keywords || // If no keywords (e.g., "All" tab), include everything
            (item.title && containsTopics(item.title, keywords)) ||
            (item.contentSnippet && containsTopics(item.contentSnippet, keywords))
          )
          .map((item: any): NewsArticle => ({
            // ... (same mapping logic as before)
            source: {
              id: new URL(item.link).hostname,
              name: sourceName,
            },
            author: item.creator || item.author || null,
            title: item.title || "No Title",
            description: item.contentSnippet || item.summary || "No Description",
            url: item.link,
            urlToImage: item.enclosure?.url || item['media:content']?.$?.url || null,
            publishedAt: item.isoDate || new Date().toISOString(),
            content: item.content || null,
          }));
        
        allArticles.push(...filteredItems);
      }
    }

    // Sort all articles by date (newest first)
    allArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // De-duplicate based on URL
    const uniqueArticles = Array.from(new Map(
      allArticles.map(a => [a.url, a])
    ).values());

    // Limit to 50 most recent
    const finalArticles = uniqueArticles.slice(0, 50);

    return NextResponse.json(finalArticles);

  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}