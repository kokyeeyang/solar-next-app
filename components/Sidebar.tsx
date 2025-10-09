"use client";
import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/24/solid";
import {
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const navItems = [
  { label: "Overview", href: "/dashboard", icon: ChartBarIcon },
  { label: "Reports", href: "/reports", icon: DocumentTextIcon },
  { label: "Settings", href: "/settings", icon: Cog6ToothIcon },
];

export default function Sidebar({ isMobileOpen, setMobileOpen }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar (Only visible on large screens and above) */}
      <div className="hidden lg:flex flex-col w-64 h-screen bg-gray-900 text-white p-4 fixed top-0 left-0 z-30">
        <h2 className="text-2xl font-bold mb-6">SOLAR</h2>
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 py-3 px-3 hover:bg-gray-700 rounded"
          >
            <Icon className="h-6 w-6" />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* Mobile Slide-in Sidebar */}
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
