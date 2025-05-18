'use client';
import { useState, useEffect } from 'react';
import { User, Sun, Moon, Bell, Settings, LogOut } from 'lucide-react';
import { useTheme } from './ThemeContext';
import Link from 'next/link';

export default function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    window.location.href = '/login';
  };

  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setIsOpen(false);
      }
    };
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, []);

  return (
    <div className="relative dropdown-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-50">
          {/* Profile */}
          <Link
            href="/profile"
            className="flex items-center px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <User className="w-5 h-5 mr-3" />
            Profile
          </Link>

          <button
            onClick={toggleTheme}
            className="flex items-center px-4 py-2 w-full text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 mr-3" />
            ) : (
              <Moon className="w-5 h-5 mr-3" />
            )}
            {isDarkMode ? 'Light' : 'Dark'}
          </button>

          <button className="flex items-center px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 w-full">
            <Bell className="w-5 h-5 mr-3" />
            Notifications
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}