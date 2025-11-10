import SearchBar from "@/components/SearchBar";

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Search arXiv Papers</h1>
      <SearchBar />
    </div>
  );
}