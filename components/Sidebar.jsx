"use client";
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
        ${isCollapsed ? "w-12" : "w-40"}
        h-[calc(100vh-4rem)] py-6 flex flex-col
        bg-white dark:bg-gray-900
        z-40
      `}
    >
      <nav className="flex-1 px-2 overflow-y-auto">
        <ul className="space-y-2">
          <li>
            <CollapseButton
              isCollapsed={isCollapsed}
              toggleCollapse={toggleCollapse}
            />
          </li>

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
        <div className="mt-auto px-2 border-t-2 border-gray-900 dark:border-white shrink-0">
          <Footer />
        </div>
      )}
    </aside>
  );
}
