/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Save from "@/models/Save"; // Import new model
import { headers } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const cookieHeader = (await headers()).get("cookie");
  const token = cookieHeader?.split("auth_token=")[1]?.split(";")[0];
  
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    const { paperId, paperTitle, action } = await req.json(); // Accept title

    await dbConnect();
    
    // 1. Update User (Array of Strings) - Keep for backward compatibility
    const update = action === "add" 
      ? { $addToSet: { savedPapers: paperId } }
      : { $pull: { savedPapers: paperId } };

    await User.findByIdAndUpdate(decoded.userId, update);

    // 2. Update Save Collection (For Activity Feed)
    if (action === "add") {
        // Use upsert to prevent duplicates
        await Save.findOneAndUpdate(
            { paperId, userId: decoded.userId },
            { paperTitle }, // Update title if exists
            { upsert: true, new: true }
        );
    } else {
        await Save.findOneAndDelete({ paperId, userId: decoded.userId });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Bookmark failed" }, { status: 500 });
  }
}