import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // 1. Await params for Next.js 15
    const { id } = await params;
    console.log("Fetching profile for ID:", id); // Check server console for this

    // 2. Validate ID format
    if (!id || id.length !== 24) {
        console.error("Invalid ID format:", id);
        return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
    }
    
    // 3. Fetch user
    const user = await User.findById(id).select("-password -email");
    
    if (!user) {
      console.error("User not found in DB");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  
    return NextResponse.json({
      id: user._id,
      username: user.username,
      role: user.role,
      interests: user.interests || [],
      followedAuthors: user.followedAuthors || [],
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0
    });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}