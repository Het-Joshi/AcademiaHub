import { NextResponse } from "next/server";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  const cookieHeader = (await headers()).get("cookie");
  const token = cookieHeader?.split("auth_token=")[1]?.split(";")[0];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    const { targetUsername, action } = await req.json();

    await dbConnect();
    const currentUser = await User.findById(decoded.userId);
    const targetUser = await User.findOne({ username: targetUsername });

    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (currentUser.username === targetUsername) return NextResponse.json({ error: "Cannot follow self" }, { status: 400 });

    if (action === "follow") {
        // Add target to current's following
        await User.findByIdAndUpdate(currentUser._id, { $addToSet: { following: targetUser._id } });
        // Add current to target's followers
        await User.findByIdAndUpdate(targetUser._id, { $addToSet: { followers: currentUser._id } });
    } else {
        // Unfollow
        await User.findByIdAndUpdate(currentUser._id, { $pull: { following: targetUser._id } });
        await User.findByIdAndUpdate(targetUser._id, { $pull: { followers: currentUser._id } });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}