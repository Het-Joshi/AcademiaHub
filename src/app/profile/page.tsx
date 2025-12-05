/* eslint-disable @next/next/no-html-link-for-pages */
"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import PaperCard from "@/components/PaperCard";
import { getPapersByIds } from "@/lib/arxiv";
import { ArxivPaper } from "@/types";

export default function Profile() {
  const { user, logout } = useAuth();
  const [savedPapersFull, setSavedPapersFull] = useState<ArxivPaper[]>([]);

  useEffect(() => {
    // FIX: Only fetch if we have IDs
    if (user?.savedPapers?.length) {
      getPapersByIds(user.savedPapers).then(setSavedPapersFull);
    }
  }, [user]);

  if (!user) return <div className="text-center text-black mt-20 text-xl">Please Login to view your profile</div>;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="glass-card mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">{user.username}</h1>
            <p className="text-blue-700 opacity-80">{user.email}</p>
            <div className="mt-2 flex gap-2">
               <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/10 text-gray-700 border border-black/20 uppercase">
                  {user.role}
               </span>
            </div>
          </div>
        </div>
        <button onClick={logout} className="px-6 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Interests */}
        <div className="space-y-8">
            <div className="glass-card">
                <h2 className="text-lg font-bold text-black mb-4 border-b border-white/10 pb-2">Interests</h2>
                <div className="flex flex-wrap gap-2">
                    {user.interests && user.interests.length > 0 ? (
                        user.interests.map(i => (
                            <span key={i} className="px-3 py-1 bg-blue-900/30 text-blue-800 border border-blue-500/30 rounded-full text-sm">
                                {i}
                            </span>
                        ))
                    ) : (
                        <p className="text-gray-400 text-sm italic">No interests added yet.</p>
                    )}
                </div>
            </div>

            <div className="glass-card">
                <h2 className="text-lg font-bold text-black mb-4 border-b border-white/10 pb-2">Following</h2>
                <div className="flex flex-wrap gap-2">
                    {user.followedAuthors && user.followedAuthors.length > 0 ? (
                        user.followedAuthors.map(a => (
                            <span key={a} className="px-3 py-1 bg-purple-900/30 text-purple-700 border border-purple-500/30 rounded-full text-sm">
                                {a}
                            </span>
                        ))
                    ) : (
                        <p className="text-gray-400 text-sm italic">Not following anyone.</p>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: Saved Papers */}
        <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-2">
                <span>📚</span> Saved Papers
            </h2>
            <div className="space-y-4">
                {savedPapersFull.length > 0 ? (
                    savedPapersFull.map(paper => (
                        <PaperCard key={paper.id} paper={paper} />
                    ))
                ) : (
                    <div className="glass-card text-center py-12">
                        <p className="text-gray-400 mb-4">You haven&apos;t saved any papers yet.</p>
                        <a href="/" className="btn-primary inline-block">Explore Papers</a>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}