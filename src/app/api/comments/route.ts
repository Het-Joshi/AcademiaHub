// src/app/api/comments/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Comment from "@/models/Comment";
import User from "@/models/User";

// GET: Fetch comments by paperId OR username
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get("paperId");
  const username = searchParams.get("username");

  await dbConnect();

  let query = {};
  if (paperId) query = { paperId };
  else if (username) query = { username };
  else return NextResponse.json([]);

  const comments = await Comment.find(query).sort({ createdAt: -1 });
  return NextResponse.json(comments);
}

// POST: Create a comment
export async function POST(req: Request) {
  const cookieHeader = (await headers()).get("cookie");
  const token = cookieHeader?.split("auth_token=")[1]?.split(";")[0];

  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    const { paperId, content } = await req.json();

    if (!content.trim()) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });

    await dbConnect();
    
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

// DELETE: Delete a comment (Admin or Owner)
export async function DELETE(req: Request) {
  const cookieHeader = (await headers()).get("cookie");
  const token = cookieHeader?.split("auth_token=")[1]?.split(";")[0];

  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("id");

    if (!commentId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await dbConnect();

    const comment = await Comment.findById(commentId);
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

    // Check permissions: Admin or Comment Owner
    const user = await User.findById(decoded.userId);
    const isAdmin = user?.role === 'admin';
    const isOwner = comment.user.toString() === decoded.userId;

    if (!isAdmin && !isOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await Comment.findByIdAndDelete(commentId);
    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}