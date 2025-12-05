/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    const cookieHeader = (await headers()).get("cookie");
    const token = cookieHeader?.split("auth_token=")[1]?.split(";")[0];

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    await dbConnect();
    
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Format for frontend
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      interests: user.interests,
      followedAuthors: user.followedAuthors,
      savedPapers: user.savedPapers,
    };

    return NextResponse.json({ user: userData }, { status: 200 });
  } catch (err) {
    // If token is invalid/expired, return null user but 200 OK so frontend knows it's "Guest"
    return NextResponse.json({ user: null }, { status: 200 });
  }
}