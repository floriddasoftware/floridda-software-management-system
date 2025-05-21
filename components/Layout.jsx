"use client";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsCollapsed(false);
      } else {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="h-screen bg-white dark:bg-gray-900">
      <Navbar className="fixed top-0 left-0 w-full z-50" />
      <div className="flex flex-row h-[calc(100vh-64px)] pt-16">
        <Sidebar
          isCollapsed={isCollapsed}
          toggleCollapse={() => setIsCollapsed(!isCollapsed)}
          className="transition-all duration-300"
        />
        <main
          className={`flex-1 h-full overflow-y-auto p-6 transition-all duration-300 ${
            isCollapsed ? "ml-10" : "ml-40"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}