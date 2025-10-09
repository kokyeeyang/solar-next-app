"use client";
import { useState, useRef, useEffect } from "react";

// const METRICS = ["Candidate Calls", "Candidates Added", "Jobs Added", "Cvs Sent", "Interviews", "Client Calls", "Companies Added", "Contacts Added", "Spec CVs"];

const resizableMetrics = ["Candidate Calls", "Candidates Added", "Jobs Added", "Cvs Sent", "Interviews", "Client Calls", "Companies Added", "Contacts Added", "Spec CVs"];

const fixedMetrics = ["Candidates with multiple interviews (CMI)", "A Jobs with multiple interviews (JMI)", "Ratios"];

interface MetricSelectorProps {
  selectedMetrics: string[];
  selectedFixedMetrics: string[];
  onChangeResizable: (metrics: string[]) => void;
  onChangeFixed: (metrics: string[]) => void;
}

export default function MetricSelector({ selectedMetrics, selectedFixedMetrics, onChangeResizable, onChangeFixed }: MetricSelectorProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
    console.log("selectedFixedMetrics: ", selectedFixedMetrics);
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedFixedMetrics]);

  const toggleMetric = (metric: string, type: "resizable" | "fixed") => {
    const selected = type === "resizable" ? selectedMetrics : selectedFixedMetrics;
    const setter = type === "resizable" ? onChangeResizable : onChangeFixed;

    setter(
      selected.includes(metric)
        ? selected.filter((m) => m !== metric)
        : [...selected, metric]
    );
  };


  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="bg-gray-800 px-4 py-2 rounded shadow border hover:bg-gray-100"
      >
        Select Metrics
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-stone-600 border rounded shadow-lg z-30 p-3"
          ref={dropdownRef}>
            <div className="font-bold text-white mb-2">Resizable Metrics</div>
            {resizableMetrics.map((metric) => (
              <label
                key={metric}
                className="flex items-center space-x-2 mb-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedMetrics.includes(metric)}
                  onChange={() => toggleMetric(metric, "resizable")}
                />
                <span>{metric}</span>
              </label>
            ))}
            <div className="font-bold text-white mb-2">Fixed Metrics</div>
            {fixedMetrics.map((metric) => (
              <label
                key={metric}
                className="flex items-center space-x-2 mb-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedFixedMetrics.includes(metric)}
                  onChange={() => toggleMetric(metric, "fixed")}
                />
                <span>{metric}</span>
              </label>
            ))}
        </div>
      )}
    </div>
  );
}
