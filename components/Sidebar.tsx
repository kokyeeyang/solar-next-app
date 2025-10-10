"use client";
import Link from "next/link";
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import {
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";

interface SidebarProps {
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const navItems = [
  { label: "Overview", href: "/dashboard", icon: ChartBarIcon },
  { label: "Analysis", href: "/analysis", icon: MagnifyingGlassIcon },
  { label: "Reports", href: "/reports", icon: DocumentTextIcon },
  { label: "Settings", href: "/settings", icon: Cog6ToothIcon },
];

export default function Sidebar({
  isMobileOpen,
  setMobileOpen,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  return (
    <>
      {/* ✅ Desktop Sidebar */}
      <div
        className={`hidden lg:flex flex-col h-screen bg-gray-900 text-white p-4 fixed top-0 left-0 z-30 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Collapse Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded hover:bg-gray-800 transition"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-6 h-6" />
            ) : (
              <ChevronLeftIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Logo */}
        <h2 className={`font-bold text-2xl mb-6 transition-all duration-300 ${isCollapsed ? "opacity-0 hidden" : "opacity-100 block"}`}>
          SOLAR
        </h2>

        {/* Nav Links */}
        <nav className="flex flex-col gap-2">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 py-3 px-3 hover:bg-gray-700 rounded transition-all ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <Icon className="h-6 w-6" />
              {!isCollapsed && <span>{label}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* ✅ Mobile Sidebar (same as before) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Sidebar menu panel */}
          <div className="w-4/5 max-w-xs bg-gray-900 h-full p-4 text-white shadow-lg z-50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">SOLAR</h2>
              <button onClick={() => setMobileOpen(false)}>
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            {navItems.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 py-3 px-3 hover:bg-gray-700 rounded"
              >
                <Icon className="h-6 w-6" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Solid black overlay */}
          <div
            className="flex-1 bg-black bg-opacity-100"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
