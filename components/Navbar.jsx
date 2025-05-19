"use client";
import { Search, Bell, User, PhoneCall, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import SettingsDropdown from "./SettingsDropdown";
import { useTheme } from "./ThemeContext";
import { useSession } from "next-auth/react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import UserInfo from "./UserInfo";
import NotificationList from "./NotificationList";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const { isDarkMode } = useTheme();
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      const fetchNotifications = async () => {
        try {
          const q = query(
            collection(db, "notifications"),
            where("userId", "==", session.user.email),
            where("read", "==", false)
          );
          const querySnapshot = await getDocs(q);
          setNotifications(
            querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      };
      fetchNotifications();
    }
  }, [session]);

  const handleLogout = () => {
    window.location.href = "/ERING";
  };

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
        <SearchBar onSearch={(term) => console.log("Search term:", term)} />
      </div>

      <div className="hidden items-center gap-8 lg:flex">
        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileDropdown(false);
            }}
            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full relative"
          >
            <Bell className="w-6 h-6" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-50">
              <NotificationList onClose={() => setShowNotifications(false)} />
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifications(false);
            }}
            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full"
          >
            <User className="w-6 h-6" />
          </button>
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-50">
              <UserInfo />
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full"
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