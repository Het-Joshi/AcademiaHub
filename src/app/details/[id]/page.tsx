/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPapersByIds } from "@/lib/arxiv";
import { ArxivPaper } from "@/types";
import { useAuth } from "@/context/AuthContext";

export default function PaperDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [paper, setPaper] = useState<ArxivPaper | null>(null);
  
  // Comment State
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Like State
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  // 1. Fetch Paper, Comments, and Likes
  useEffect(() => {
    if (id) {
      // Fetch Paper Data
      getPapersByIds([id as string]).then((papers) => {
        if (papers.length > 0) setPaper(papers[0]);
      });

      // Fetch Comments
      fetchComments();
      
      // Fetch Likes
      fetchLikes();
    }
  }, [id, user]); // Refetch likes when user logs in

  const fetchComments = async () => {
    const res = await fetch(`/api/comments?paperId=${id}`);
    if (res.ok) setComments(await res.json());
  };

  const fetchLikes = async () => {
    const res = await fetch(`/api/likes?paperId=${id}`);
    if (res.ok) {
        const data = await res.json();
        setLikeCount(data.count);
        setHasLiked(data.hasLiked);
    }
  };

  const handleLike = async () => {
    if (!user) return alert("Please login to like papers.");
    if (liking) return;

    setLiking(true);
    // Optimistic Update
    setHasLiked(!hasLiked);
    setLikeCount(prev => hasLiked ? prev - 1 : prev + 1);

    try {
        await fetch("/api/likes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paperId: id })
        });
        // Background refresh to ensure sync
        fetchLikes();
    } catch (err) {
        // Revert on error
        setHasLiked(!hasLiked);
        setLikeCount(prev => hasLiked ? prev + 1 : prev - 1);
    } finally {
        setLiking(false);
    }
  };

  const submitComment = async () => {
    if (!user) return alert("Please login to comment");
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
        const res = await fetch("/api/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paperId: id, content: newComment }),
        });
        
        if (res.ok) {
            setNewComment("");
            fetchComments();
        } else {
            alert("Failed to post comment");
        }
    } finally {
        setSubmittingComment(false);
    }
  };

  if (!paper) return (
    <div className="flex justify-center items-center h-[50vh]">
        <div className="rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto text-emerald-650">
      {/* --- Main Glass Card --- */}
      <div className="glass-card mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold mb-2 text-black-800 leading-tight">{paper.title}</h1>
        
        {/* --- NEW: Authors List --- */}
        <div className="text-lg text-emerald-800 mb-4 font-medium">
          {paper.authors.join(", ")}
        </div>

        {/* --- NEW: Journal/Venue Reference (if available) --- */}
        {paper.journalRef && (
           <div className="mb-4 text-sm font-semibold text-stone-600 bg-stone-100 border border-stone-200 inline-block px-3 py-1 rounded">
              Published in: {paper.journalRef}
           </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6 text-sm text-white font-mono">
          <span className="bg-emerald-900/40 px-3 py-1 rounded border border-emerald-500/20">
            {paper.published.substring(0, 10)}
          </span>
          <span className="bg-emerald-900/40 px-3 py-1 rounded border border-emerald-500/20">
            {paper.primaryCategory}
          </span>
          <span className="flex items-center gap-1 text-black">
             ❤️ {likeCount} Like{likeCount !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="mb-8 p-6 bg-gray-20 rounded-xl border border-white/5 shadow-inner">
          <h3 className="font-semibold mb-3 text-emerald-700 uppercase tracking-widest text-xs">Abstract</h3>
          <p className="leading-relaxed text-stone-700">{paper.summary}</p>
        </div>

        <div className="flex gap-4 items-center border-t border-white/10 pt-6">
            <a 
                href={paper.pdfUrl} 
                target="_blank" 
                rel="noreferrer"
                className="btn-primary shadow-lg shadow-emerald-500/20"
            >
                Download PDF
            </a>
            
            <button 
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold border transition-all ${
                    hasLiked 
                    ? "bg-red-500/20 text-red-600 border-red-500/50" 
                    : "bg-white/5 hover:bg-white/10 text-gray-700 border-stone-200"
                }`}
            >
                {hasLiked ? "❤️ Liked" : "🤍 Like"}
            </button>
        </div>
      </div>

      {/* --- Comment Section --- */}
      <div className="glass-card">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span>💬</span> Community Discussion
        </h3>
        
        {/* Input Area */}
        {user ? (
          <div className="flex gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white shadow-lg">
                {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
                <textarea
                    className="glass-input min-h-[80px] mb-2 resize-none"
                    placeholder="Share your insights..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <button 
                    onClick={submitComment} 
                    disabled={submittingComment || !newComment.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold text-sm float-right transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submittingComment ? "Posting..." : "Post Comment"}
                </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-900/10 p-4 rounded-lg text-center mb-8 border border-emerald-500/20">
            <p className="text-emerald-800">
                <a href="/login" className="font-bold underline hover:text-black">Log in</a> to join the discussion.
            </p>
          </div>
        )}

        {/* Comment List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
             <p className="text-center text-gray-400 italic py-4">No comments yet. Be the first to share your thoughts.</p>
          ) : (
             comments.map((c) => (
                <div key={c._id} className="bg-white/40 p-4 rounded-xl border border-white/40">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-700">@{c.username}</span>
                    </div>
                    <span className="text-xs text-stone-500 font-mono">
                        {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <p className="text-stone-700 leading-relaxed text-sm">{c.content}</p>
                </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}