"use client";
import { Menu } from "lucide-react";

export default function CollapseButton({ isCollapsed, toggleCollapse }) {
  return (
    <button
      onClick={toggleCollapse}
      className={`flex items-center p-2 rounded-lg w-full ${
        isCollapsed ? "justify-center" : "justify-start"
      } text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700`}
    >
      <Menu className={`w-6 h-6 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
      {!isCollapsed && <span></span>}
    </button>
  );
}
