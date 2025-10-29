"use client";

import React from "react";
import { Bars3Icon, MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import DateRangePicker from "./DatePicker";

interface TopBarProps {
  // Sidebar controls
  onOpenSidebar?: () => void;
  showBurger?: boolean;

  // Metric selector (optional element)
  metricSelector?: React.ReactNode;

  // Theme
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  showThemeToggle?: boolean;

  // Filters
  onOpenFilter?: () => void;
  showFilters?: boolean;

  // Layout save
  onSaveLayout?: () => Promise<void> | void;
  showSaveLayout?: boolean;

  // Date range picker
  dateRange?: [Date | null, Date | null];
  onDateChange?: (range: [Date | null, Date | null]) => void;
  showDatePicker?: boolean;
}

/**
 * A reusable top control bar for dashboard-style pages.
 * All buttons are optional and configurable via props.
 */
export default function TopBar({
  onOpenSidebar,
  showBurger = true,
  metricSelector,
  theme,
  onToggleTheme,
  showThemeToggle = true,
  onOpenFilter,
  showFilters = true,
  onSaveLayout,
  showSaveLayout = true,
  dateRange,
  onDateChange,
  showDatePicker = true,
}: TopBarProps) {
  return (
    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
      {/* Burger (mobile only) */}
      {showBurger && (
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-white rounded bg-gray-800 hover:bg-gray-700"
          aria-label="Open sidebar"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      )}

      {/* Metric selector */}
      {metricSelector && metricSelector}

      {/* Theme toggle */}
      {showThemeToggle && onToggleTheme && (
        <button
          onClick={onToggleTheme}
          className="bg-gray-800 text-white px-3 py-2 rounded hover:bg-gray-700 flex items-center"
        >
          {theme === "dark" ? (
            <>
              <SunIcon className="w-5 h-5 mr-2" /> Light Mode
            </>
          ) : (
            <>
              <MoonIcon className="w-5 h-5 mr-2" /> Dark Mode
            </>
          )}
        </button>
      )}

      {/* Filters */}
      {showFilters && onOpenFilter && (
        <button
          onClick={onOpenFilter}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Filters
        </button>
      )}

      {/* Save layout */}
      {showSaveLayout && onSaveLayout && (
        <button
          onClick={onSaveLayout}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Save Layout
        </button>
      )}

      {/* Date range picker */}
      {showDatePicker && onDateChange && (
        <DateRangePicker onChange={onDateChange} />
      )}
    </div>
  );
}
