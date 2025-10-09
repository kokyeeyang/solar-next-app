"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function DateRangePicker({ onChange }) {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([startOfYear, today]);
  const [startDate, endDate] = dateRange;

  return (
    <div className="relative w-full max-w-xs">
      <DatePicker
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={(update) => {
          setDateRange(update);
          onChange(update);
        }}
        isClearable
        placeholderText="Select date range"
        className="w-full bg-gray-800 text-white border border-gray-600 rounded-md px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        calendarClassName="!bg-gray-900 !text-white !border-gray-700"
        dayClassName={(date) =>
          "text-sm hover:bg-blue-600 hover:text-white transition duration-150 ease-in-out rounded-full"
        }
      />
    </div>
  );
}
