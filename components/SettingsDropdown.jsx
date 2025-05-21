"use client";
import { useState, useEffect } from "react";
import { Sun, Moon, Bell, Settings, LogOut } from "lucide-react";
import { useTheme } from "./ThemeContext";
import UserInfo from "./UserInfo";
import NotificationList from "./NotificationList";
import { Tooltip } from "react-tooltip";
import { signOut } from "next-auth/react";

export default function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest(".dropdown-container")) {
        setIsOpen(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener("click", closeDropdown);
    return () => window.removeEventListener("click", closeDropdown);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false }); 
    window.location.replace("/login"); 
  };

  return (
    <div className="relative dropdown-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        data-tooltip-id="settings-tooltip"
        data-tooltip-content="Settings"
      >
        <Settings className="w-5 h-5" />
        <Tooltip id="settings-tooltip" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-50">
          <div className="px-4 py-2">
            <UserInfo />
          </div>
          <hr className="my-2" />
          <button
            onClick={toggleTheme}
            className="flex items-center px-4 py-2 w-full text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 mr-3" />
            ) : (
              <Moon className="w-5 h-5 mr-3" />
            )}
            {isDarkMode ? "Light" : "Dark"}
          </button>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="flex items-center px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
          >
            <Bell className="w-5 h-5 mr-3" />
            Notifications
          </button>
          {showNotifications && (
            <div className="px-4 py-2">
              <NotificationList onClose={() => setShowNotifications(false)} />
            </div>
          )}
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