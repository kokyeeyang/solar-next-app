"use client";

import { useState } from "react";

export default function ExportDropdown(){
    const [open, isOpen] = useState(false);
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

    const exportJobsToCvsSent = () => {
        window.open(`${baseUrl}/api/jobs-to-cvs-sent/export`, "_blank");
    }

    return (
        <div className="relative inline-block text-left">
            <button 
                onClick={() => isOpen(!open)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-md"
            >Export</button>
            {/* {open && (
                <button
                    onClick={exportJobsToCvsSent}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                    📊 Export Jobs Added to CVs Sent Data
                </button>
            )} */}

            {open && (
                <div
                className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 animate-fade-in
                            transition-all duration-200"
                >
                <ul className="py-1 text-gray-800">
                    <li>
                    <button
                        onClick={exportJobsToCvsSent}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                    >
                        📄 Export Jobs Added to CVs Sent Data
                    </button>
                    </li>
                </ul>
                </div>
            )}
    </div>
  );
}