/* eslint-disable react/jsx-no-undef */
import { Suspense } from "react"; // 1. Import Suspense
import SearchBar from "@/components/SearchBar";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-center">Search arXiv Papers</h1>
      
      {/* 2. Wrap SearchBar in Suspense */}
      <Suspense fallback={<div className="text-center p-4">Loading search...</div>}>
        <SearchBar />
      </Suspense>

      <br/>

        <div className="glass-card">
          <h2 className="text-3lg font-monospace font-bold mb-2">Github Repository:</h2>
          <button className="btn-primary mb-4">
            <Link href="https://github.com/Het-Joshi/AcademiaHub">Code (Contains front and back end)</Link>
          </button>
        </div>

    </div>
  );
}
