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
import TopBar from "../../../components/TopBar";
import { useTheme } from "@/context/ThemeContext";

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
  const { theme, toggleTheme } = useTheme();
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
          process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

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
    <div className="flex min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors duration-500">
      {/* ✅ Sidebar stays fixed on the left */}
      <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen}  isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* ✅ Main content is shifted to the right */}
      <main className="flex-1 ml-64 p-6 transition-all duration-300 lg:ml-64 md:ml-0">
        <TopBar
          onOpenSidebar={() => setMobileOpen(true)}
          showBurger
          onDateChange={setDateRange}
          showDatePicker
          showThemeToggle
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        {/* Settings */}
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
