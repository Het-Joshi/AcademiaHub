"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth(); // You need to update AuthContext login signature to accept data

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      login(data.user); // Pass user data to context
    } else {
      alert("Invalid login");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white/90 p-8 rounded-xl shadow-2xl backdrop-blur">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Welcome Back</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          className="w-full p-3 border rounded-lg focus:ring-2 ring-blue-500 outline-none"
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
        />
        <input 
          className="w-full p-3 border rounded-lg focus:ring-2 ring-blue-500 outline-none"
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
        />
        <button className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition">
          Log In
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link href="/register" className="text-blue-600 hover:underline">
          Need an account? Register
        </Link>
      </div>
    </div>
  );
}