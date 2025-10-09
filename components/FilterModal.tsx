"use client";

import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: Record<string, string[]>) => void;
  options: {
    DealboardTeam: string[];
    Function: string[];
    Office: string[];
    Region: string[];
    RevenueStream: string[];
    Sector: string[];
    Team: string[];
    // Consultant?: { label: string; value: string }[];
  };
}

interface MultiSelectDropdownProps {
  label: string;
  field: string;
  selected: string[];
  setSelected: (value: string[]) => void;
  options: (string | { label: string; value: string })[];
  openDropdown: string | null;
  setOpenDropdown: (value: string | null) => void;
}

function MultiSelectDropdown({
  label,
  field,
  selected,
  setSelected,
  options,
  openDropdown,
  setOpenDropdown,
}: MultiSelectDropdownProps) {
  const toggleOption = (option: string) => {
    setSelected(
      selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option]
    );
  };

  return (
    <div className="relative w-full">
      <label className="block text-white font-semibold mb-1">{label}</label>
      <button
        type="button"
        className="w-full bg-gray-800 text-white border border-rose-700 rounded px-4 py-2 text-left"
        onClick={() => setOpenDropdown(openDropdown === field ? null : field)}
      >
        {selected.length > 0 ? selected.map((val) => {
            const match = options.find((opt) => {
              typeof opt === "string" ? opt === val : opt.value === val;
            });
            return typeof match === "string" ? match : match?.label;
        })
        .filter(Boolean)
        .join(", ")
        .slice(0,40)
        : `Please select ${label.toLowerCase()}`}
      </button>

      {openDropdown === field && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-stone-600 border border-gray-700 rounded shadow-lg">
          {options.map((option) => {
            const label = typeof option === "string" ? option : option.label;
            const value = typeof option === "string" ? option : option.value;
            return (
              <label
                key={`${value}-${label}`}
                className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mr-2 accent-blue-500"
                  checked={selected.includes(value)}
                  onChange={() => toggleOption(value)}
                />
                {label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FilterModal({
  isOpen,
  onClose,
  onApply,
  options,
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<Record<string, string[]>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleChange = (field: string, values: string[]) => {
    setLocalFilters((prev) => ({ ...prev, [field]: values }));
  };

  if (!isOpen) return null;

  const modalRoot =
    typeof window !== "undefined" ? document.getElementById("modal-root") : null;
  if (!modalRoot) return null;

  return ReactDOM.createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999]"
    >
      <div className="relative w-[700px] max-h-[90vh] bg-gray-800 border border-gray-700 rounded shadow-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Filter Options</h2>
          <button onClick={onClose} className="text-white text-2xl hover:text-gray-400">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
          {Object.entries(options).map(([field, values]) => (
            <MultiSelectDropdown
              key={field}
              label={field.replace(/([A-Z])/g, " $1").trim()}
              field={field}
              selected={localFilters[field] || []}
              setSelected={(value) => handleChange(field, value)}
              options={values}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end space-x-3 border-t border-gray-700">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApply(localFilters);
              onClose();
            }}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
}
