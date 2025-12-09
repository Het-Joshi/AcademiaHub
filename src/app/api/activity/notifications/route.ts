import { NextResponse } from "next/server";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Comment from "@/models/Comment";
import Like from "@/models/Like";
import Save from "@/models/Save";

// Force this route to be dynamic (no caching on Vercel/Next server)
export const dynamic = 'force-dynamic';

async function getUserId() {
  const cookieHeader = (await headers()).get("cookie");
  const token = cookieHeader?.split("auth_token=")[1]?.split(";")[0];
  if (!token) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    return decoded.userId;
  } catch (err) {
    return null;
  }
}

// GET: Count unread activities
export async function GET() {
  // Prevent browser caching via headers
  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ count: 0 }, { headers: noCacheHeaders });

  try {
    await dbConnect();
    const user = await User.findById(userId);
    if (!user || !user.following || user.following.length === 0) {
      return NextResponse.json({ count: 0 }, { headers: noCacheHeaders });
    }

    const lastSeen = user.lastSeenActivity || new Date(0);
    const followingIds = user.following;

    // Count all activities created AFTER lastSeen
    const [commentCount, likeCount, saveCount] = await Promise.all([
      Comment.countDocuments({ user: { $in: followingIds }, createdAt: { $gt: lastSeen } }),
      Like.countDocuments({ userId: { $in: followingIds }, createdAt: { $gt: lastSeen } }),
      Save.countDocuments({ userId: { $in: followingIds }, createdAt: { $gt: lastSeen } })
    ]);

    return NextResponse.json(
      { count: commentCount + likeCount + saveCount }, 
      { headers: noCacheHeaders }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ count: 0 }, { headers: noCacheHeaders });
  }
}

// POST: Mark notifications as read
export async function POST() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();
    await User.findByIdAndUpdate(userId, { lastSeenActivity: new Date() });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}