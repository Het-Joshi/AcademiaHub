/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { headers } from "next/headers"; // In real app, verify JWT here

// Note: In a production app, you must decode the JWT from the cookie to get the userId.
// For this prototype, we'll assume you can pass the username or use a simple mock mechanism
// if you haven't implemented full JWT middleware yet. 
// However, since we set the cookie in login, let's try to do it right.

import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const cookieHeader = (await headers()).get("cookie");
  const token = cookieHeader?.split("auth_token=")[1]?.split(";")[0];
  
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    const { interests, followedAuthors } = await req.json();

    await dbConnect();
    await User.findByIdAndUpdate(decoded.userId, {
      interests,
      followedAuthors
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}