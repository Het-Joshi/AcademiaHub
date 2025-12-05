"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Success: Redirect to login
        router.push("/login?registered=true");
      } else {
        const data = await res.json();
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white/90 p-8 rounded-xl shadow-2xl backdrop-blur">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Join AcademiaHub
      </h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input 
            className="w-full p-3 border rounded-lg focus:ring-2 ring-blue-500 outline-none"
            placeholder="johndoe"
            value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            className="w-full p-3 border rounded-lg focus:ring-2 ring-blue-500 outline-none"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            className="w-full p-3 border rounded-lg focus:ring-2 ring-blue-500 outline-none"
            type="password" 
            placeholder="••••••••" 
            value={formData.password} 
            onChange={e => setFormData({...formData, password: e.target.value})}
            required
            minLength={6}
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-blue-600 text-black p-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-blue-400"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Log in here
        </Link>
      </div>
    </div>
  );
}