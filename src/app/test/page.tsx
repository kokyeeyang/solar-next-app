"use client";
import { useTheme } from "@/context/ThemeContext";

export default function TestPage() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="p-10">
      <p>Current theme: {theme}</p>
      <button
        onClick={toggleTheme}
        className="mt-4 bg-gray-800 text-white px-4 py-2 rounded"
      >
        Toggle Theme
      </button>
    </div>
  );
}