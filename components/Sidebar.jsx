// components/Sidebar.jsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Box, DollarSign, PlusSquare } from "lucide-react";
import CollapseButton from "./CollapseButton";
import Footer from "./Footer";

export default function Sidebar({ isCollapsed, toggleCollapse }) {
  const path = usePathname() || "";

  const items = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/products", icon: Box, label: "Products" },
    { href: "/sales", icon: DollarSign, label: "Sales" },
    { href: "/add", icon: PlusSquare, label: "Add" },
  ];

  return (
    <aside
      className={`
      fixed lg:relative
      ${isCollapsed ? "w-12" : "w-50"}
      h-screen py-6 flex flex-col
      bg-white dark:bg-gray-900
      transition-all duration-300
      z-40
    `}
    >
      <CollapseButton
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
      />

      <nav className="flex-1 px-2">
        <ul className="space-y-2">
          {items.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center p-2 rounded-lg ${
                  path === href
                    ? "bg-blue-200 dark:bg-blue-400 text-gray-900 dark:text-white font-semibold"
                    : "text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${isCollapsed ? "mx-auto" : "mr-3"}`}
                />
                {!isCollapsed && <span>{label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {!isCollapsed && (
        <div className="mt-auto px-2">
          <Footer />
        </div>
      )}
    </aside>
  );
}
