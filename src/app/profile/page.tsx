// src/app/profile/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProfileRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect to the dynamic username page
        router.push(`/profile/${user.username}`);
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return <div className="flex justify-center p-20">Loading profile...</div>;
}