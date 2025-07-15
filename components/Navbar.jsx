"use client";
import Link from "next/link";
import { Bell, User, PhoneCall, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import SettingsDropdown from "./SettingsDropdown";
import { useTheme } from "./ThemeContext";
import { useSession, signOut } from "next-auth/react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import UserInfo from "./UserInfo";
import NotificationList from "./NotificationList";
import SearchBar from "./SearchBar";
import { Tooltip } from "react-tooltip";

export default function Navbar({ className = "" }) {
  const { isDarkMode } = useTheme();
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const path = usePathname() || "";

  const showSearchBar = path === "/products" || path === "/sales";

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

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.replace("/login");
  };

  return (
    <nav
      className={`flex items-center justify-between h-16 w-screen px-4 sm:px-5 lg:px-6 shadow shadow-gray-950 dark:shadow-white bg-white dark:bg-gray-900 ${className}`}
    >
      <Link href="/dashboard">
        <div className="flex items-center gap-1 transition-colors logo-container">
          <PhoneCall className="w-4 h-4 lg:w-7 lg:h-7 md:w-6 md:h-6 sm:w-5 sm:h-5 mt-3 text-red-950" />
          <div className="flex flex-col items-center text-blue-400 hover:text-blue-500 lg:-space-y-2 -space-y-1">
            <h6 className="lg:text-[24px] md:text-[20px] sm:text-[16px] text-[12px] font-bold">
              Floridda
            </h6>
            <h6 className="lg:text-[12px] md:text-[10px] sm-text-[8px] text-[6px] m-0 leading-tight">
              Software
            </h6>
          </div>
        </div>
      </Link>

      {showSearchBar && (
        <div className="flex flex-1 max-w-2xl mx-4">
          <SearchBar />
        </div>
      )}

      <div className="hidden items-center gap-8 lg:flex">
        <ThemeToggle />

        <div
          className="relative"
          data-tooltip-id="notifications-tooltip"
          data-tooltip-content="Notifications"
        >
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileDropdown(false);
            }}
            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full relative transition-transform duration-200 transform hover:scale-110"
          >
            <Bell className="w-6 h-6" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          <Tooltip id="notifications-tooltip" />
          {showNotifications && (
            <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-50">
              <NotificationList onClose={() => setShowNotifications(false)} />
            </div>
          )}
        </div>

        <div
          className="relative"
          data-tooltip-id="profile-tooltip"
          data-tooltip-content="Profile"
        >
          <button
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifications(false);
            }}
            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-transform duration-200 transform hover:scale-110"
          >
            <User className="w-6 h-6" />
          </button>
          <Tooltip id="profile-tooltip" />
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-50">
              <UserInfo />
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-transform duration-200 transform hover:scale-110"
          data-tooltip-id="logout-tooltip"
          data-tooltip-content="Logout"
        >
          <LogOut className="w-6 h-6" />
          <Tooltip id="logout-tooltip" />
        </button>
      </div>

      <div className="lg:hidden">
        <SettingsDropdown />
      </div>
    </nav>
  );
}