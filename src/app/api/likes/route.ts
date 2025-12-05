/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Like from "@/models/Like";

// GET: Fetch like count & if current user liked it
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get("paperId");

  if (!paperId) return NextResponse.json({ error: "Missing paperId" }, { status: 400 });

  await dbConnect();

  // 1. Get Total Count
  const count = await Like.countDocuments({ paperId });

  // 2. Check if current user liked (if logged in)
  let hasLiked = false;
  const cookieHeader = (await headers()).get("cookie");
  const token = cookieHeader?.split("auth_token=")[1]?.split(";")[0];

  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
      const userLike = await Like.findOne({ paperId, userId: decoded.userId });
      hasLiked = !!userLike;
    } catch (e) {
      // Token invalid, treat as guest
    }
  }

  return NextResponse.json({ count, hasLiked });
}

// POST: Toggle Like
export async function POST(req: Request) {
  const cookieHeader = (await headers()).get("cookie");
  const token = cookieHeader?.split("auth_token=")[1]?.split(";")[0];

  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    const { paperId } = await req.json();

    await dbConnect();

    const existingLike = await Like.findOne({ paperId, userId: decoded.userId });

    if (existingLike) {
      // Unlike
      await Like.findByIdAndDelete(existingLike._id);
      return NextResponse.json({ action: "unliked" });
    } else {
      // Like
      await Like.create({ paperId, userId: decoded.userId });
      return NextResponse.json({ action: "liked" });
    }
  } catch (err) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}