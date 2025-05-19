"use client";
import { Search } from "lucide-react";
import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <div className="relative w-50 lg:w-100 md:w-90 sm:w-80">
      <Search className="absolute top-1/2 left-1 w-3 h-3 md:w-5 md:h-5 sm:w-3 sm:h-3 transform -translate-y-1/2 text-gray-900 dark:text-white" />
      <input
        type="text"
        placeholder="Search product group"
        value={searchTerm}
        onChange={handleSearch}
        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white w-full lg:h-10 md:h-8 sm:h-7 h-7 pl-5 sm:pl-6 md:pl-7 lg:pl-8 pr-2 sm:pr-4 py-2 rounded-lg focus:outline-none focus:ring text-xs sm:text-sm md:text-base lg:text-lg border-2 border-gray-400 dark:border-gray-50"
      />
    </div>
  );
}