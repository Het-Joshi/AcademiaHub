<<<<<<< HEAD
// API route for user registration
import { NextResponse } from "next/server";
import { userExists, createUser } from "@/lib/users";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Make sure all required fields are provided
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
=======
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();
    
    console.log("Attempting to register:", { username, email }); // Log 1

    await dbConnect();

    // Check for existing user to prevent duplicate key errors
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
>>>>>>> e7e03a8 (Added Comments, likes and themes)
        { status: 400 }
      );
    }

<<<<<<< HEAD
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if email is already registered
    if (userExists(email)) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create the new user account
    const newUser = createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password, // TODO: Hash passwords before storing
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}

=======
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await User.create({
      username,
      email,
      password: hashedPassword,
    });

    return NextResponse.json({ message: "User created" }, { status: 201 });

  } catch (error: any) {
    // Log the ACTUAL error to your terminal so you can see it
    console.error("REGISTRATION ERROR:", error); 
    
    return NextResponse.json(
      { error: error.message || "Registration failed" }, 
      { status: 500 }
    );
  }
}
>>>>>>> e7e03a8 (Added Comments, likes and themes)
