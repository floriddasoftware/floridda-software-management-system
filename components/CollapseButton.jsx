"use client";
import { Menu } from "lucide-react";

export default function CollapseButton({ isCollapsed, toggleCollapse }) {
  return (
    <button
      onClick={toggleCollapse}
      className={`flex items-center p-2 rounded-lg w-full ${
        isCollapsed ? "justify-center" : "justify-start"
      } text-gray-900 dark:text-white lg:hidden`}
    >
      <Menu className={`w-8 h-8 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
      {!isCollapsed && <span></span>}
    </button>
  );
}