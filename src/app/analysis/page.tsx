"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import Sidebar from "../../../components/Sidebar";
import DateRangePicker from "../../../components/DatePicker";
import FilterModal from "../../../components/FilterModal";
import DropdownSettings from "../../../components/DropdownSettings";
import ToggleModal from "../../../components/ToggleModal";
import ExpandedModeModal from "../../../components/ExpandedModeModal";
import ExportDropdown from "../../../components/ExportDropdown";

import { Bars3Icon } from "@heroicons/react/24/solid";

interface ChartData {
  group: string;
  within3Days: number;
  within5Days: number;
  within2Weeks: number;
  after2Weeks: number;
}

export default function AnalysisPage() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<"team" | "region">("team");

  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([startOfYear, today]);
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [isAssociatedModalOpen, setIsAssociatedModalOpen] = useState(false);
  const [isAssociatedModeOn, setIsAssociatedModeOn] = useState(false);
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);
  const [isExpandedModeOn, setIsExpandedModeOn] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [filterOptions, setFilterOptions] = useState({
    DealboardTeam: [] as string[],
    Function: [] as string[],
    Office: [] as string[],
    Region: [] as string[],
    RevenueStream: [] as string[],
    Sector: [] as string[],
    Team: [] as string[],
    Consultant: [] as { label: string; value: string }[],
  });

  interface DateRangePickerProps {
    onChange: (dateRange: [Date | null, Date | null]) => void;
  }
  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const baseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

        const res = await fetch(
          `${baseUrl}/api/jobs-to-cvs-sent/chart?groupBy=${groupBy}`
        );

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json();
        const formatted: ChartData[] = data.map((item: any) => ({
          group: item.GroupName || "Unknown",
          within3Days: item.SentWithin3Days || 0,
          within5Days: item.SentWithin5Days || 0,
          within2Weeks: item.SentWithin2Weeks || 0,
          after2Weeks: item.SentAfter2Weeks || 0,
        }));

        setChartData(formatted);
      } catch (error) {
        console.error("❌ Failed to fetch chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupBy]);

  useEffect(() => {

    const initializeData = async (overrideFilters: Record<string, string[]>, associated: boolean = isAssociatedModeOn, expanded: boolean = isExpandedModeOn) => {
        const start = dateRange[0];
        const end = dateRange[1];
        if (!start || !end) return;
    
        const formattedStart = formatDate(start);
        const formattedEnd = formatDate(end);
        const filtersToUse = overrideFilters || activeFilters;
      };
      
    const loadFilterOptions = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(
        `https://so-api.azurewebsites.net/ingress/ajax/api?metric=headcount&datefrom=2025-01-01&dateto=${today}&output=total&hidetotal=true`
      );
      const data = await res.json();

      const fields = ["DealboardTeam", "Function", "Office", "Region", "RevenueStream", "Sector", "Team"];
      const options: Record<string, Set<string>> = {};
      fields.forEach((field) => (options[field] = new Set()));

      const consultantRes = await fetch(
        `https://turbine.spencer-ogden.com/ingress/ajax/breadcrumbs.php`
      );
      const consultantData = await consultantRes.json();

      const consultants = consultantData['ActiveConsultantsList'].map((item: any) => ({
        label: item.name,
        value: item.bullhornID,
      }));

      data.forEach((item: any) => {
        fields.forEach((field) => {
          if (item[field]) {
            options[field].add(item[field]);
          } 
        });
      });

      const parsed = Object.fromEntries(
        Object.entries(options).map(([k, v]) => {
          return [k, Array.from(v).sort()];
        })
      );

      setFilterOptions({
        DealboardTeam: parsed.DealboardTeam || [],
        Function: parsed.Function || [],
        Office: parsed.Office || [],
        Region: parsed.Region || [],
        RevenueStream: parsed.RevenueStream || [],
        Sector: parsed.Sector || [],
        Team: parsed.Team || [],
        Consultant: consultants,
      });
    };


    loadFilterOptions();
  }, [dateRange, isAssociatedModeOn, isExpandedModeOn, activeFilters]);

  return (
    <div className="flex bg-black min-h-screen text-white">
      {/* ✅ Sidebar stays fixed on the left */}
      <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen}  isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* ✅ Main content is shifted to the right */}
      <main className="flex-1 ml-64 p-6 transition-all duration-300 lg:ml-64 md:ml-0">
        {/* Top Controls */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 text-white rounded bg-gray-800 hover:bg-gray-700"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <button
            onClick={() => setFilterOpen(true)}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Filters
          </button>
          <DateRangePicker onChange={setDateRange} />
        </div>

        {/* Settings */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <DropdownSettings
            onAssociatedModeClick={() => setIsAssociatedModalOpen(true)}
            onExpandedModeClick={() => setIsExpandedModalOpen(true)}
          />
        </div>
        <div className="flex justify-between items-center mb-6">
          <ExportDropdown />
        </div>
        {/* Filter / Modals */}
        <FilterModal
          isOpen={isFilterOpen}
          onClose={() => setFilterOpen(false)}
          options={filterOptions}
          onApply={async (filters) => {
            console.log("Filters applied:", filters);
          }}
        />
        <ToggleModal
          isOpen={isAssociatedModalOpen}
          onClose={() => setIsAssociatedModalOpen(false)}
          isOn={isAssociatedModeOn}
          toggleSwitch={() => setIsAssociatedModeOn((prev) => !prev)}
        />
        <ExpandedModeModal
          isOpen={isExpandedModalOpen}
          onClose={() => setIsExpandedModalOpen(false)}
          isOn={isExpandedModeOn}
          toggleSwitch={() => setIsExpandedModeOn((prev) => !prev)}
        />

        {/* Title */}
        <h1 className="text-2xl font-bold mb-6">
          📊 Job Sendouts by {groupBy === "team" ? "Team" : "Region"}
        </h1>

        {/* Toggle Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setGroupBy("team")}
            className={`px-4 py-2 rounded ${
              groupBy === "team"
                ? "bg-blue-600 text-white"
                : "bg-white text-black border"
            }`}
          >
            Group by Team
          </button>
          <button
            onClick={() => setGroupBy("region")}
            className={`px-4 py-2 rounded ${
              groupBy === "region"
                ? "bg-blue-600 text-white"
                : "bg-white text-black border"
            }`}
          >
            Group by Region
          </button>
        </div>

        {/* Chart */}
        {loading ? (
          <p className="text-gray-500">Loading chart data...</p>
        ) : (
          <div className="w-full h-[500px] bg-white p-6 rounded-lg shadow text-black">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="group"
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => dataMax * 1.2]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend verticalAlign="top" />
                <Bar dataKey="within3Days" stackId="a" fill="#4F46E5" name="≤ 3 Days" />
                <Bar dataKey="within5Days" stackId="a" fill="#38BDF8" name="≤ 5 Days" />
                <Bar dataKey="within2Weeks" stackId="a" fill="#22C55E" name="≤ 2 Weeks" />
                <Bar dataKey="after2Weeks" stackId="a" fill="#F97316" name="> 2 Weeks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </main>
    </div>
  );
}
