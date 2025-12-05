import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST(req: Request) {
  // Clear the cookie by setting maxAge to 0
  const cookie = serialize("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0), // Expire immediately
    path: "/",
  });

  return NextResponse.json({ message: "Logged out" }, {
    status: 200,
    headers: { "Set-Cookie": cookie }
  });
}