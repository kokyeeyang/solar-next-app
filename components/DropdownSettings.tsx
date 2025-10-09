import { useState, useRef, useEffect } from "react";

interface DropdownSettingsProps {
    onAssociatedModeClick?: () => void;
    onExpandedModeClick?: () => void;
}
export default function DropdownSettings({ onAssociatedModeClick, onExpandedModeClick }: DropdownSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
//   const [isAssociatedModalOpen, setIsAssociatedModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none"
      >
        Actions ▾
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg z-50 border border-gray-200">
          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={
                () => {onAssociatedModeClick?.();
                    setIsOpen(false);
                }
            }
          >
            Associated mode 
          </button>
          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={
                () => {onExpandedModeClick?.();
                    setIsOpen(false);
                }
            }
          >
            Expanded mode 
          </button>
          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Option 3
          </button>
        </div>
      )}
    </div>
  );
}
