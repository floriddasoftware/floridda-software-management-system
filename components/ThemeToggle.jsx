"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <button className="p-2 rounded-full opacity-0" aria-hidden="true" />;
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="p-2 rounded-full text-gray-950 dark:text-white hover:text-white dark:hover:text-gray-950 bg-white dark:bg-gray-950 hover:bg-gray-950 dark:hover:bg-white"
    >
      {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
    </button>
  );
}
