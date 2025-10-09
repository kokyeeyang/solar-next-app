"use client";

import { useEffect, useState } from "react";
import ReactDOM from "react-dom";

interface ToggleModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOn: boolean;
  toggleSwitch: () => void;
}

export default function ToggleModal({ isOpen, onClose, isOn, toggleSwitch }: ToggleModalProps) {
  // Prevent scroll when modal is open
  const [expandedMode, setExpandedMode] = useState<"ON" | "">("");
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalRoot = typeof window !== "undefined" ? document.getElementById("modal-root") : null;
  if (!modalRoot) return null;

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-black rounded-lg p-6 w-80 text-center shadow-xl"
      >
        <h2 className="text-xl font-semibold mb-4">Expanded mode</h2>
        <h3 className="text-lg mb-4">
            What is expanded mode?
            Expanded mode is a feature which can be activated when viewing metrics at the consultant level. 
            Useful if previously in a different team, when enabled this mode looks beyond the consultants current team, and searches for everything that has been done by the individual.
        </h3>
        <div
          onClick={() => {
            toggleSwitch();
            setExpandedMode((prev) => (prev === "ON" ? "" : "ON"));
          }}
          className={`w-16 h-8 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer mx-auto ${
            isOn ? "bg-green-500" : "bg-gray-400"
          }`}
        >
          <div
            className={`bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ${
              isOn ? "translate-x-8" : "translate-x-0"
            }`}
          />
        </div>

        <p className="mt-4">{isOn ? "Enabled" : "Disabled"}</p>

        <button
          onClick={onClose}
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
        >
          Close
        </button>
      </div>
    </div>,
    modalRoot
  );
}
