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

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="h-screen bg-white dark:bg-gray-900">
      <Navbar className="fixed top-0 left-0 w-full z-50" />
      <div className="flex flex-row h-[calc(100vh-64px)] pt-16">
        {!isCollapsed && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={toggleCollapse}
          />
        )}
        <Sidebar
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
        />
        <main className="flex-1 h-full overflow-y-auto p-6 lg:ml-40">
          {children}
        </main>
      </div>
    </div>
  );
}