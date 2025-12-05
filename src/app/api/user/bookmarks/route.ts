/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const cookieHeader = (await headers()).get("cookie");
  const token = cookieHeader?.split("auth_token=")[1]?.split(";")[0];
  
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    const { paperId, action } = await req.json();

    await dbConnect();
    
    const update = action === "add" 
      ? { $addToSet: { savedPapers: paperId } }
      : { $pull: { savedPapers: paperId } };

    await User.findByIdAndUpdate(decoded.userId, update);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Bookmark failed" }, { status: 500 });
  }
}