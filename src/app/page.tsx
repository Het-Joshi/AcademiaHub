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
          <ul className="text-2lg">
            A project by students from <span className="font-bold md-2"> Section 4 </span>
          <li className="mt-3">Het Rutul Joshi</li>
          <li>Zahra Mohammadi</li>
          </ul>
        </div>

    </div>
  );
}