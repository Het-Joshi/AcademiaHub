// src/app/details/[id]/page.tsx
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      getPapersByIds([id as string]).then((papers) => {
        if (papers.length > 0) setPaper(papers[0]);
      });
      fetchComments();
      fetchLikes();
    }
  }, [id, user]);

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
    setHasLiked(!hasLiked);
    setLikeCount(prev => hasLiked ? prev - 1 : prev + 1);

    try {
        await fetch("/api/likes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paperId: id })
        });
        fetchLikes();
    } catch (err) {
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

  const handleDeleteComment = async (commentId: string) => {
      if(!confirm("Delete this comment?")) return;
      
      const res = await fetch(`/api/comments?id=${commentId}`, { method: "DELETE" });
      if (res.ok) {
          setComments(prev => prev.filter(c => c._id !== commentId));
      } else {
          alert("Failed to delete.");
      }
  };

  if (!paper) return <div className="flex justify-center items-center h-[50vh]"><div className="rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div></div>;

  return (
    <div className="max-w-4xl mx-auto text-emerald-650">
      <div className="glass-card mb-8">
        <h1 className="text-3xl font-bold mb-2 text-black-800 leading-tight">{paper.title}</h1>
        <div className="text-lg text-emerald-800 mb-4 font-medium">{paper.authors.join(", ")}</div>
        <div className="mb-8 p-6 bg-gray-20 rounded-xl border border-white/5 shadow-inner">
          <p className="leading-relaxed text-stone-700">{paper.summary}</p>
        </div>
        <div className="flex gap-4 items-center border-t border-white/10 pt-6">
            <a href={paper.pdfUrl} target="_blank" rel="noreferrer" className="btn-primary shadow-lg shadow-emerald-500/20">Download PDF</a>
            <button onClick={handleLike} disabled={liking} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold border transition-all ${hasLiked ? "bg-red-500/20 text-red-600 border-red-500/50" : "bg-white/5 hover:bg-white/10 text-gray-700 border-stone-200"}`}>{hasLiked ? "❤️ Liked" : "🤍 Like"} {likeCount}</button>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span>💬</span> Community Discussion</h3>
        {user ? (
          <div className="flex gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white shadow-lg">{user.username.charAt(0).toUpperCase()}</div>
            <div className="flex-1">
                <textarea className="glass-input min-h-[80px] mb-2 resize-none" placeholder="Share your insights..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                <button onClick={submitComment} disabled={submittingComment || !newComment.trim()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold text-sm float-right transition disabled:opacity-50">{submittingComment ? "Posting..." : "Post Comment"}</button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-900/10 p-4 rounded-lg text-center mb-8 border border-emerald-500/20"><p className="text-emerald-800"><a href="/login" className="font-bold underline hover:text-black">Log in</a> to join the discussion.</p></div>
        )}

        <div className="space-y-4">
          {comments.length === 0 ? <p className="text-center text-gray-400 italic py-4">No comments yet.</p> : comments.map((c) => (
             <div key={c._id} className="bg-white/40 p-4 rounded-xl border border-white/40 relative group">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2"><span className="font-bold text-emerald-700">@{c.username}</span></div>
                    <span className="text-xs text-stone-500 font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-stone-700 leading-relaxed text-sm">{c.content}</p>
                {/* Delete Button for Admin or Owner */}
                {user && (user.role === 'admin' || user.username === c.username) && (
                    <button 
                        onClick={() => handleDeleteComment(c._id)}
                        className="absolute top-2 right-2 text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                    >
                        Delete
                    </button>
                )}
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}