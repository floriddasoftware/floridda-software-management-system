"use client";
import { Search } from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import { useRouter, usePathname } from "next/navigation";

export default function SearchBar() {
  const { searchTerm, setSearchTerm } = useSearch();
  const router = useRouter();
  const pathname = usePathname();

  const visibleRoutes = ["/products", "/sales", "/add"];
  const isVisible = visibleRoutes.includes(pathname);

  const placeholder = pathname === "/add" ? "Search salesperson..." : "Search products...";

  if (!isVisible) return null;

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!pathname.includes("/products") && pathname !== "/add") {
      router.push("/products");
    }
  };

  return (
    <div className="relative w-full max-w-2xl">
      <Search className="absolute top-1/2 left-3 w-5 h-5 transform -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleSearch}
        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}