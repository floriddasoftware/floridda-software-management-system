"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Box, DollarSign, PlusSquare } from "lucide-react";
import CollapseButton from "./CollapseButton";
import Footer from "./Footer";

export default function Sidebar({
  isCollapsed,
  toggleCollapse,
  className = "",
}) {
  const { data: session } = useSession();
  const path = usePathname() || "";

  const items =
    session?.user?.role === "admin"
      ? [
          { href: "/dashboard", icon: Home, label: "Dashboard" },
          { href: "/products", icon: Box, label: "Products" },
          { href: "/sales", icon: DollarSign, label: "Sales" },
          { href: "/add", icon: PlusSquare, label: "Add" },
        ]
      : [
          { href: "/dashboard", icon: Home, label: "Dashboard" },
          { href: "/sales", icon: DollarSign, label: "Sales" },
        ];

  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-64px)] z-40 flex flex-col bg-white dark:bg-gray-900 transition-all duration-300 ${
        isCollapsed ? "w-10" : "w-40"
      } ${className}`}
    >
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
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
        <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <Footer />
        </div>
      )}
    </aside>
  );
}