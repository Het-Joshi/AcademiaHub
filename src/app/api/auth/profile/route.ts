/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// Helper to get user from token
async function getUserFromToken() {
  const cookieHeader = (await headers()).get("cookie");
  const token = cookieHeader?.split("auth_token=")[1]?.split(";")[0];
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    return decoded;
  } catch (err) {
    return null;
  }
}

export async function GET(req: Request) {
  const decoded = await getUserFromToken();
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const user = await User.findById(decoded.userId).select("-password");
  
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  
  return NextResponse.json({ user });
}

export async function PUT(req: Request) {
  const decoded = await getUserFromToken();
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { username, email, role, interests, currentPassword, newPassword } = body;

    await dbConnect();
    const user = await User.findById(decoded.userId);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 1. Update Basic Info
    if (username) user.username = username;
    if (interests) user.interests = interests;
    
    // 2. Sensitive Updates
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return NextResponse.json({ error: "Email already taken" }, { status: 400 });
      user.email = email;
    }

    if (role) {
      user.role = role;
    }

    // 3. Password Change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password required" }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be > 6 chars" }, { status: 400 });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    // Remove password before sending back
    const { password, ...userData } = user.toObject();

    return NextResponse.json({ success: true, user: userData });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}