// components/CollapseButton.jsx
"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CollapseButton({ isCollapsed, toggleCollapse }) {
  return (
    <button
      onClick={toggleCollapse}
      className="lg:hidden absolute -right-3 top-1/2 transform -translate-y-1/2 rounded-full bg-gray-200 dark:bg-gray-700 p-1 hover:bg-gray-300 dark:hover:bg-gray-600 z-10 transition-colors"
    >
      {isCollapsed ? (
        <ChevronRight className="w-4 h-4 text-gray-900 dark:text-white" />
      ) : (
        <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-white" />
      )}
    </button>
  );
}