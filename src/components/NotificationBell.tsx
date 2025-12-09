"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotificationBell({ username }: { username: string }) {
  const [count, setCount] = useState(0);
  const router = useRouter();

  const fetchCount = async () => {
    try {
      // Added { cache: 'no-store' } to prevent browser caching
      const res = await fetch("/api/activity/notifications", { 
        cache: 'no-store',
        next: { revalidate: 0 } 
      });
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Poll for notifications every 60 seconds
  useEffect(() => {
    fetchCount(); // Initial check
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (count > 0) {
      // Optimistically clear count immediately
      setCount(0);
      
      // Clear notifications on server
      await fetch("/api/activity/notifications", { 
        method: "POST",
        cache: 'no-store'
      });
    }
    // Navigate to Profile -> Activity Tab
    router.push(`/profile/${username}?tab=activity`);
  };

  return (
    <button 
      onClick={handleClick}
      className="relative p-2 rounded-md hover:bg-emerald-50 transition-colors group"
      title="Activity Feed"
    >
      <span className="text-xl group-hover:scale-110 transition-transform block">🔔</span>
      
      {count > 0 && (
        <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-bounce">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}