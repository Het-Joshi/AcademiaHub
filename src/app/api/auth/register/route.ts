/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"; // Ensure you have installed: npm install bcryptjs @types/bcryptjs
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();
    
    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Note: 'name' in your NextAuth session maps to 'username' here
    await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    return NextResponse.json({ message: "User created successfully" }, { status: 201 });

  } catch (error: any) {
    console.error("REGISTRATION ERROR:", error); 
    return NextResponse.json(
      { error: error.message || "Registration failed" }, 
      { status: 500 }
    );
  }
}