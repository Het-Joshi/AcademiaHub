import { NextResponse } from "next/server";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Comment from "@/models/Comment";
import Like from "@/models/Like";
import Save from "@/models/Save";

export async function GET(req: Request) {
  const cookieHeader = (await headers()).get("cookie");
  const token = cookieHeader?.split("auth_token=")[1]?.split(";")[0];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    await dbConnect();
    
    // Get current user's following list
    const currentUser = await User.findById(decoded.userId);
    const followingIds = currentUser.following;

    if (!followingIds || followingIds.length === 0) {
        return NextResponse.json([]);
    }

    // Fetch activities from followed users
    const [comments, likes, saves] = await Promise.all([
        Comment.find({ user: { $in: followingIds } }).sort({ createdAt: -1 }).limit(20).lean(),
        Like.find({ userId: { $in: followingIds } }).populate('userId', 'username').sort({ createdAt: -1 }).limit(20).lean(),
        Save.find({ userId: { $in: followingIds } }).populate('userId', 'username').sort({ createdAt: -1 }).limit(20).lean()
    ]);

    // Combine and Sort
    const activities = [
        ...comments.map(c => ({ 
            ...c, 
            type: 'comment', 
            date: c.createdAt,
            // Comment model stores username directly
        })),
        ...likes.map(l => ({ 
            ...l, 
            type: 'like', 
            date: l.createdAt, 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            username: (l.userId as any).username 
        })),
        ...saves.map(s => ({ 
            ...s, 
            type: 'save', 
            date: s.createdAt, 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            username: (s.userId as any).username 
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50);

    return NextResponse.json(activities);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}