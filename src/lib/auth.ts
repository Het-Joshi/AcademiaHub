import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        await dbConnect();

        // 1. Find user in MongoDB
        const user = await User.findOne({ email });

        // 2. If user not found or password doesn't match
        if (!user || !(await bcrypt.compare(password, user.password))) {
          return null;
        }

        // 3. Return user object (NextAuth will put this in the JWT)
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.username, // Mapping MongoDB 'username' to NextAuth 'name'
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin", // Your custom signin page
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
};

export const authOptions = authConfig;
export const { auth, handlers } = NextAuth(authConfig);