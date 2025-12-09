"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation"; // Added useSearchParams
import { useAuth } from "@/context/AuthContext";
import { getPapersByIds } from "@/lib/arxiv"; 
import PaperCard from "@/components/PaperCard";
import Link from "next/link"; 

export default function UserProfile() {
  const params = useParams();
  const searchParams = useSearchParams(); // Hook to read URL query
  const router = useRouter();
  const { user: currentUser, login, logout } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Initialize tab from URL or default to 'feed'
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "feed");

  // Sync state if URL changes (e.g. back button or direct link)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Function to change tab and update URL
  const switchTab = (tab: string) => {
      setActiveTab(tab);
      // Update URL without full reload
      router.replace(`/profile/${params.username}?tab=${tab}`, { scroll: false });
  };

  // Data for tabs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [savedPapersList, setSavedPapersList] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userComments, setUserComments] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [networkActivity, setNetworkActivity] = useState<any[]>([]); 
  const [loadingTab, setLoadingTab] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false); 
  const [followLoading, setFollowLoading] = useState(false); 

  const isOwner = currentUser?.username === decodeURIComponent(params.username as string);

  const [editForm, setEditForm] = useState({
    username: "", email: "", role: "", interests: "", currentPassword: "", newPassword: ""
  });

  // 1. Fetch Profile
  useEffect(() => {
    if (!params?.username) return;
    setLoading(true);
    
    fetch(`/api/users/profile/${params.username}`)
      .then((res) => {
        if (!res.ok) throw new Error("User not found");
        return res.json();
      })
      .then((data) => {
        setProfileUser(data);
        setError("");
        if (currentUser && data.followers) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setIsFollowing(data.followers.some((f: any) => f.username === currentUser.username));
        }
        setEditForm(prev => ({
          ...prev,
          username: data.username,
          email: (currentUser?.id === data.id ? currentUser?.email || "" : ""),
          role: data.role,
          interests: (data.interests || []).join(", ")
        }));
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [params?.username, currentUser]);

  // 2. Fetch Tab Data
  useEffect(() => {
    if (!profileUser) return;

    const loadTabData = async () => {
        setLoadingTab(true);
        try {
            if (activeTab === 'saved') {
                if (profileUser.savedPapers?.length > 0) {
                    const papers = await getPapersByIds(profileUser.savedPapers);
                    setSavedPapersList(papers);
                } else {
                    setSavedPapersList([]);
                }
            } else if (activeTab === 'feed') {
                const res = await fetch(`/api/comments?username=${profileUser.username}`);
                if (res.ok) setUserComments(await res.json());
            } else if (activeTab === 'activity' && isOwner) { 
                const res = await fetch(`/api/activity/following`);
                if (res.ok) setNetworkActivity(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingTab(false);
        }
    };
    loadTabData();
  }, [activeTab, profileUser, isOwner]);

  const handleFollowToggle = async () => {
      if (!currentUser) return router.push("/login");
      setFollowLoading(true);
      const action = isFollowing ? "unfollow" : "follow";
      
      try {
          const res = await fetch("/api/users/follow", {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({ targetUsername: profileUser.username, action })
          });
          
          if (res.ok) {
              setIsFollowing(!isFollowing);
              setProfileUser((prev: any) => ({
                  ...prev,
                  followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
              }));
          }
      } catch (err) {
          console.error("Follow error", err);
      } finally {
          setFollowLoading(false);
      }
  };

  const handleUpdate = async () => {
    setError("");
    setSuccessMsg("");
    const interestsArray = editForm.interests.split(",").map((s: string) => s.trim()).filter(Boolean);
    try {
        const res = await fetch("/api/auth/profile", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
             username: editForm.username, email: editForm.email, role: editForm.role, interests: interestsArray,
             currentPassword: editForm.currentPassword || undefined, newPassword: editForm.newPassword || undefined
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Update failed"); return; }
        setProfileUser((prev: any) => ({ ...prev, username: editForm.username, role: editForm.role, interests: interestsArray }));
        setSuccessMsg("Profile updated successfully!");
        setIsEditing(false);
        setEditForm(prev => ({ ...prev, currentPassword: "", newPassword: "" }));
        if (editForm.username !== params.username) { login(data.user); router.push(`/profile/${editForm.username}`); } 
        else if (isOwner) { login(data.user); }
    } catch (err) { setError("An error occurred while saving."); }
  };

  const handleLogout = () => { if (confirm("Log out?")) { logout(); router.push("/login"); } };

  if (loading) return <div className="flex justify-center mt-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (error || !profileUser) return <div className="text-center mt-20 text-red-500">{error || "User not found"}</div>;

  const getBannerGradient = (role: string) => {
    switch(role) {
        case 'admin': return "bg-gradient-to-r from-slate-800 to-stone-800";
        case 'researcher': return "bg-gradient-to-r from-emerald-700 to-teal-600";
        default: return "bg-gradient-to-r from-blue-600 to-indigo-600";
    }
  };

  const tabs = ['feed', 'saved', 'network'];
  if (isOwner) tabs.push('activity'); 

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/50 mb-8">
        <div className={`h-48 ${getBannerGradient(profileUser.role)} relative`}>
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>

        <div className="px-8 pb-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-end -mt-12 md:-mt-16 mb-4">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center text-5xl font-bold text-stone-700 overflow-hidden">
                        {profileUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute bottom-1 right-1 bg-stone-800 text-white text-xs px-2 py-1 rounded-full shadow border-2 border-white capitalize">
                        {profileUser.role}
                    </div>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0 mb-2">
                    {isOwner ? (
                        <>
                            <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-2 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition shadow-sm">
                                {isEditing ? "Cancel" : "Edit Profile"}
                            </button>
                            <button onClick={handleLogout} className="px-4 py-2 rounded-full border border-red-200 text-red-600 font-semibold hover:bg-red-50">Log Out</button>
                        </>
                    ) : (
                       <button 
                         onClick={handleFollowToggle} 
                         disabled={followLoading}
                         className={`px-8 py-2 text-white rounded-full font-semibold transition shadow-md ${isFollowing ? "bg-stone-500 hover:bg-stone-600" : "bg-blue-600 hover:bg-blue-700"}`}
                        >
                           {followLoading ? "..." : (isFollowing ? "Unfollow" : "Follow")}
                       </button>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-stone-900">{profileUser.username}</h1>
                <p className="text-stone-500 font-medium">@{profileUser.username.toLowerCase().replace(/\s/g, '')}</p>
            </div>

            {!isEditing && (
                <div className="flex px-0 border-t border-stone-100 mt-6 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => switchTab(tab)} // Use new switchTab
                            className={`py-3 px-6 text-sm font-bold border-b-2 transition capitalize whitespace-nowrap ${activeTab === tab ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
                        >
                            {tab === 'network' ? 'Following/Followers' : (tab === 'activity' ? 'Network Activity' : tab)}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      {successMsg && <div className="mb-6 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-100 flex items-center gap-2">✅ {successMsg}</div>}
      {error && <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2">⚠️ {error}</div>}

      {isEditing ? (
        <div className="bg-white/60 backdrop-blur p-8 rounded-2xl border border-white shadow-lg">
            <h2 className="text-xl font-bold text-stone-800 mb-6">Edit Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div><label className="block text-sm font-semibold text-stone-700 mb-2">Username</label><input className="glass-input bg-white/50" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} /></div>
                 <div><label className="block text-sm font-semibold text-stone-700 mb-2">Role</label><select className="glass-input bg-white/50" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}><option value="student">Student</option><option value="researcher">Researcher</option><option value="admin">Administrator</option></select></div>
                 <div className="md:col-span-2"><label className="block text-sm font-semibold text-stone-700 mb-2">Interests</label><input className="glass-input bg-white/50" value={editForm.interests} onChange={e => setEditForm({...editForm, interests: e.target.value})} /></div>
                 <div className="md:col-span-2 border-t pt-4 mt-4"><label className="block text-sm font-semibold text-stone-700 mb-2">Email</label><input className="glass-input bg-white/50" type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} /></div>
                 <div><label className="block text-sm font-semibold text-stone-700 mb-2">New Password</label><input className="glass-input bg-white/50" type="password" value={editForm.newPassword} onChange={e => setEditForm({...editForm, newPassword: e.target.value})} /></div>
                 <div><label className="block text-sm font-semibold text-stone-700 mb-2">Current Password (Required)</label><input className="glass-input bg-white/50" type="password" value={editForm.currentPassword} onChange={e => setEditForm({...editForm, currentPassword: e.target.value})} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-8"><button onClick={() => setIsEditing(false)} className="px-6 py-2 text-stone-600 font-medium hover:bg-stone-100 rounded-lg">Cancel</button><button onClick={handleUpdate} className="btn-primary px-8 py-2">Save Changes</button></div>
        </div>
      ) : (
        <div className="min-h-[200px]">
            {loadingTab ? (
                <div className="text-center py-12 text-stone-400">Loading content...</div>
            ) : (
                <>
                    {/* FEED TAB */}
                    {activeTab === 'feed' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-stone-800 mb-4">My Contributions</h3>
                            {userComments.length > 0 ? (
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                userComments.map((comment: any) => (
                                    <div key={comment._id} className="glass-card p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-emerald-700">@{comment.username}</span>
                                            <span className="text-stone-400 text-sm">commented on:</span>
                                            {comment.paperTitle && <span className="font-medium text-stone-600 truncate max-w-[300px]">{comment.paperTitle}</span>}
                                            <span className="text-stone-400 text-xs ml-auto">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-stone-700">"{comment.content}"</p>
                                        <a href={`/details/${comment.paperId}`} className="text-xs text-blue-600 hover:underline mt-2 block">View Paper →</a>
                                    </div>
                                ))
                            ) : <div className="text-center text-stone-500 italic py-8">No recent activity.</div>}
                        </div>
                    )}

                    {/* ACTIVITY TAB (Network's activity - Owner only) */}
                    {activeTab === 'activity' && isOwner && (
                         <div className="space-y-4">
                            <h3 className="font-bold text-lg text-stone-800 mb-4">Network Activity</h3>
                            {networkActivity.length > 0 ? (
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                networkActivity.map((item: any) => (
                                    <div key={item._id} className="glass-card p-4 border-l-4 border-l-blue-400">
                                        <div className="flex items-center gap-2 mb-2 text-sm">
                                            <Link href={`/profile/${item.username}`} className="font-bold text-emerald-700 hover:underline">
                                                @{item.username}
                                            </Link>
                                            <span className="text-stone-500">
                                                {item.type === 'like' && 'liked a paper'}
                                                {item.type === 'comment' && 'commented on a paper'}
                                                {item.type === 'save' && 'saved a paper'}
                                            </span>
                                            <span className="text-stone-400 text-xs ml-auto">{new Date(item.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {item.paperTitle && <div className="font-medium text-stone-800 mb-1">📄 {item.paperTitle}</div>}
                                        {item.type === 'comment' && <p className="text-stone-600 italic mb-2">"{item.content}"</p>}
                                        <a href={`/details/${item.paperId}`} className="text-xs btn-primary px-3 py-1 inline-block">View Paper</a>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-stone-500 italic py-8">
                                    <p>No recent activity from people you follow.</p>
                                    <p className="text-sm mt-2">Try following more researchers!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SAVED TAB */}
                    {activeTab === 'saved' && (
                        <div className="space-y-4">
                            {savedPapersList.length > 0 ? (
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                savedPapersList.map((paper: any) => (
                                    <PaperCard key={paper.id} paper={paper} />
                                ))
                            ) : <div className="text-center text-stone-500 italic py-8">No saved papers.</div>}
                        </div>
                    )}

                    {/* NETWORK TAB */}
                    {activeTab === 'network' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="glass-card p-6">
                                <h3 className="font-bold text-stone-800 mb-4">Following ({profileUser.followingCount})</h3>
                                <div className="flex flex-col gap-2">
                                    {profileUser.following && profileUser.following.length > 0 ? (
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        profileUser.following.map((u: any) => (
                                            <Link key={u._id} href={`/profile/${u.username}`} className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg transition">
                                                <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold">{u.username[0]}</div>
                                                <span className="font-medium text-stone-700">@{u.username}</span>
                                            </Link>
                                        ))
                                    ) : <span className="text-stone-400 text-sm">Not following anyone.</span>}
                                </div>
                            </div>
                            <div className="glass-card p-6">
                                <h3 className="font-bold text-stone-800 mb-4">Followers ({profileUser.followersCount})</h3>
                                <div className="flex flex-col gap-2">
                                    {profileUser.followers && profileUser.followers.length > 0 ? (
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        profileUser.followers.map((u: any) => (
                                            <Link key={u._id} href={`/profile/${u.username}`} className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg transition">
                                                <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold">{u.username[0]}</div>
                                                <span className="font-medium text-stone-700">@{u.username}</span>
                                            </Link>
                                        ))
                                    ) : <span className="text-stone-400 text-sm">No followers yet.</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
      )}
    </div>
  );
}