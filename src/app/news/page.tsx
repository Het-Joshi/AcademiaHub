"use client";
import { useState, useEffect }
from "react";
import { NewsArticle } from "@/types";
import NewsArticleCard from "../../components/NewsArticleCard";

// --- Define Tab categories ---
const TABS = ["All", "AI", "Security", "Open-Source", "Systems"];

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // --- State for active tab ---
  const [activeTab, setActiveTab] = useState(TABS[0]);

  // --- Re-fetch news when activeTab changes ---
  useEffect(() => {
    loadNews();
  }, [activeTab]);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      // --- Build URL based on active tab ---
      const url = activeTab === "All" 
        ? '/api/news' 
        : `/api/news?topic=${activeTab}`;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch news");
      }

      const data: NewsArticle[] = await response.json();
      setArticles(data);
      if (data.length === 0) {
        setError(`No articles found for "${activeTab}".`);
      }

    } catch (error) {
      console.error("Failed to load news:", error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading){
        return (
        <div className="flex justify-center items-center min-h-[300px]">
          {/* ... (loading spinner) ... */}
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading your news feed...</p>
          </div>
        </div>
      );
    }

    if (error && articles.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
          <p className="font-medium">⚠️ {error}</p>
        </div>
      );
    }
    
    if (articles.length === 0 && !error) {
      return <p>No recent news articles found.</p>;
    }

    // --- Render grid layout ---
    return (
      <div className="news-grid">
        {articles.map((article) => (
          <NewsArticleCard key={article.url} article={article} />
        ))}
      </div>
    );
  };

return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your News Feed</h1>
        <button
          onClick={loadNews}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? "Refreshing..." : "🔄 Refresh Feed"}
        </button>
      </div>
      
      {/* --- Tab Navigation --- */}
      <div className="tabs-container">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab ${activeTab === tab ? 'tab-active' : ''}`}
            disabled={loading}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {renderContent()}
    </div>
  );
}