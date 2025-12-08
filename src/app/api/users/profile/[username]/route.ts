// src/app/api/users/profile/[username]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await dbConnect();
    const { username } = await params;
    
    // Case-insensitive search
    const user = await User.findOne({ 
        username: { $regex: new RegExp(`^${username}$`, "i") } 
    })
    .select("-password -email")
    .populate("followers", "username")
    .populate("following", "username");
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  
    return NextResponse.json({
      id: user._id,
      username: user.username,
      role: user.role,
      interests: user.interests || [],
      followedAuthors: user.followedAuthors || [],
      savedPapers: user.savedPapers || [], // Return IDs so frontend can fetch
      followers: user.followers || [],
      following: user.following || [],
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0
    });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}