"use client";
import { Search, Bell, User, PhoneCall, LogOut } from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import SettingsDropdown from "./SettingsDropdown";
import { useTheme } from "./ThemeContext";

export default function Navbar() {
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    window.location.href = '/login';
  };

  useEffect(() => {
  }, []);

  return (
    <nav className="flex items-center justify-between h-16 w-screen px-4 sm:px-5 lg:px-6 shadow bg-white dark:bg-gray-900">
      <div className="flex gap-2 sm:gap-3 md:gap-4">
        <div className="flex items-center gap-1 text-2xl font-bold text-blue-400">
          <PhoneCall className="w-4 h-4 lg:w-7 lg:h-7 md:w-6 md:h-6 sm:w-5 sm:h-5" />
          <h6 className="lg:text-3xl md:text-2xl sm:text-xl text-base">
            Floridda
          </h6>
        </div>
      </div>

      <div className="flex">
        <div className="relative w-50 lg:w-100 md:w-90 sm:w-80">
          <Search className="absolute top-1/2 left-1 w-3 h-3 md:w-5 md:h-5 sm:w-3 sm:h-3 transform -translate-y-1/2 text-gray-900 dark:text-white" />
          <input
            type="text"
            placeholder="Search product group"
            className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white w-full lg:h-10 md:h-8 sm:h-7 h-7 pl-5 sm:pl-6 md:pl-7 lg:pl-8 pr-2 sm:pr-4 py-2 rounded-lg focus:outline-none focus:ring text-xs sm:text-sm md:text-base lg:text-lg border-2 border-gray-400 dark:border-gray-50"
          />
        </div>
      </div>

      <div className="hidden items-center gap-8 lg:flex">
        <ThemeToggle />
        
        <button className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full">
          <Bell className="w-6 h-6" />
        </button>

        <Link href="/profile" className="border-l-2 border-gray-900 dark:border-white pl-5">
          <User className="w-6 h-6 text-gray-900 dark:text-white" />
        </Link>

        <button 
          onClick={handleLogout}
          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      <div className="lg:hidden">
        <SettingsDropdown />
      </div>
    </nav>
  );
}