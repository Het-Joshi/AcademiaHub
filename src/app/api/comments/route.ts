/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Comment from "@/models/Comment";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get("paperId");
  
  if (!paperId) return NextResponse.json([]);

  await dbConnect();
  // Return newest comments first
  const comments = await Comment.find({ paperId }).sort({ createdAt: -1 });
  return NextResponse.json(comments);
}

export async function POST(req: Request) {
  const cookieHeader = (await headers()).get("cookie");
  const token = cookieHeader?.split("auth_token=")[1]?.split(";")[0];

  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    const { paperId, content } = await req.json();

    if (!content.trim()) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });

    await dbConnect();
    
    // Create comment with verified user data from token
    const comment = await Comment.create({
      paperId,
      content,
      user: decoded.userId,
      username: decoded.username, 
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}