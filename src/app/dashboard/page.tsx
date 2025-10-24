// Filename: DashboardPage.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import Sidebar from "../../../components/Sidebar";
import MetricSelector from "../../../components/MetricSelector";
import DateRangePicker from "../../../components/DatePicker";
import FilterModal from "../../../components/FilterModal";
import MetricProgressChart from "../../../components/MetricProgressChart";
import DropdownSettings from "../../../components/DropdownSettings";
import ToggleModal from "../../../components/ToggleModal";
import ExpandedModeModal from "../../../components/ExpandedModeModal";
import CommonModal from "../../../components/CommonModal";

import {
  Responsive as RGLResponsive,
  WidthProvider,
  Layouts,
  Layout,
} from "react-grid-layout";
import { Bars3Icon } from "@heroicons/react/24/solid";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

/* ───────────────────────────── Types & Constants ───────────────────────────── */

const ResponsiveGridLayout = WidthProvider(RGLResponsive);

const defaultMetrics = ["Candidate Calls", "Candidates Added", "Jobs Added"] as const;
const fixedMetric = "Candidates with multiple interviews (CMI)" as const;

const breakpoints = { lg: 1280, md: 1024, sm: 768, xs: 0 } as const;
const cols = { lg: 5, md: 3, sm: 2, xs: 1 } as const;

type BreakpointKey = keyof typeof cols;

type MetricDataMap = Record<string, { total: number; target: number }>;
type RowData = Record<string, unknown>;

type FiltersShape = {
  DealboardTeam?: string[];
  Function?: string[];
  Office?: string[];
  Region?: string[];
  RevenueStream?: string[];
  Sector?: string[];
  Team?: string[];
  Consultant?: string[];
};

type FilterOptionsState = {
  DealboardTeam: string[];
  Function: string[];
  Office: string[];
  Region: string[];
  RevenueStream: string[];
  Sector: string[];
  Team: string[];
  Consultant: { label: string; value: string }[];
};

// API response types
type TotalMetricResponse = {
  total?: number;
  target?: number;
  [k: string]: unknown;
};

type RowsResponse = {
  total?: number;
  "": RowData[]; // API places array under empty-string key
  [k: string]: unknown;
};

const API_BASE = "https://so-api.azurewebsites.net/ingress/ajax/api";

/* ───────────────────────────────── Helpers ────────────────────────────────── */

const formatDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const metricToToken = (m: string): string => m.toLowerCase().replace(/\s+/g, "");

const joinOr = (arr?: string[], sep: "," | "|" = ","): string =>
  Array.isArray(arr) && arr.length ? arr.join(sep) : "";

/** Build URLSearchParams for API calls from filters + common args */
const buildQuery = (base: Record<string, string>): string =>
  new URLSearchParams(base).toString();

/* ───────────────────────────── Component Start ────────────────────────────── */

export default function DashboardPage(): React.ReactElement {
  const today = useMemo(() => new Date(), []);
  const startOfYear = useMemo(() => new Date(today.getFullYear(), 0, 1), [today]);

  /* ─────────────── High-level selections / dates / layouts ─────────────── */

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([...defaultMetrics]);
  const [selectedFixedMetrics, setSelectedFixedMetrics] = useState<string[]>([]);

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    startOfYear,
    today,
  ]);

  const createInitialLayout = (bp: BreakpointKey): Layout[] => {
    const layout: Layout[] = [];

    defaultMetrics.forEach((metric, index) => {
      layout.push({
        i: metric,
        x: index % cols[bp],
        y: Math.floor(index / cols[bp]),
        w: 1,
        h: 2,
        static: false,
      });
    });

    layout.push({
      i: fixedMetric,
      x: 0,
      y: 100,
      w: cols[bp],
      h: 3,
      static: true,
    });

    return layout;
  };

  const [layouts, setLayouts] = useState<Layouts>(() => ({
    lg: createInitialLayout("lg"),
    md: createInitialLayout("md"),
    sm: createInitialLayout("sm"),
    xs: createInitialLayout("xs"),
  }));

  /* ─────────────────────────────── UI states ─────────────────────────────── */

  const [isMobileOpen, setMobileOpen] = useState<boolean>(false);
  const [isFilterOpen, setFilterOpen] = useState<boolean>(false);
  const [isAssociatedModalOpen, setIsAssociatedModalOpen] = useState<boolean>(false);
  const [isAssociatedModeOn, setIsAssociatedModeOn] = useState<boolean>(false);
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState<boolean>(false);
  const [isExpandedModeOn, setIsExpandedModeOn] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isCommonModalOpen, setCommonModalOpen] = useState<boolean>(false);

  /* ───────────────────────────── Tabs / Table ────────────────────────────── */

  const [activeTab, setActiveTab] = useState<"List view" | "Trends" | "Leaderboard">(
    "List view"
  );
  const [tabLoading, setTabLoading] = useState<boolean>(false);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [displayRowData, setDisplayRowData] = useState<RowData[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // caches for tabs
  const [listViewData, setListViewData] = useState<RowData[]>([]);
  const [listViewHeader, setListViewHeader] = useState<string[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<RowData[]>([]);
  const [leaderboardHeader, setLeaderboardHeader] = useState<string[]>([]);
  const [lastFetchedListMetric, setLastFetchedListMetric] = useState<string | null>(null);
  const [lastFetchedLeaderboardMetric, setLastFetchedLeaderboardMetric] = useState<
    string | null
  >(null);

  const NEXT_PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://localhost:5000";
  // metric cards
  const [metricData, setMetricData] = useState<MetricDataMap>({});
  const [loadingMetrics, setLoadingMetrics] = useState<string[]>([]);

  // fixed charts
  const [cmiChartData, setCmiChartData] = useState<RowData[]>([]);
  const [cmiChartLoading, setCmiChartLoading] = useState<boolean>(false);
  const [jmiChartData, setJmiChartData] = useState<RowData[]>([]);
  const [jmiChartLoading, setJmiChartLoading] = useState<boolean>(false);

  // filters
  const [activeFilters, setActiveFilters] = useState<FiltersShape>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptionsState>({
    DealboardTeam: [],
    Function: [],
    Office: [],
    Region: [],
    RevenueStream: [],
    Sector: [],
    Team: [],
    Consultant: [],
  });

  /* ───────────────────────────── Derived values ──────────────────────────── */

  const rowsPerPage = 30;

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return displayRowData.filter((row) =>
      Object.values(row).join("").toLowerCase().includes(term)
    );
  }, [displayRowData, searchTerm]);

  const paginatedData = useMemo(
    () => filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    [filteredData, currentPage]
  );

  const totalPages = useMemo(
    () => Math.ceil(filteredData.length / rowsPerPage),
    [filteredData.length]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, displayRowData]);

  /* ───────────────────────────── Date utilities ──────────────────────────── */

  /** Always return non-null dates, falling back to `today` */
  const getSafeDates = (): { start: Date; end: Date } => ({
    start: dateRange[0] ?? today,
    end: dateRange[1] ?? today,
  });

  /* ───────────────────────────── API helpers ─────────────────────────────── */

  const fetchMetricData = async (
    metrics: string[],
    start: string,
    end: string,
    filters: FiltersShape,
    associated: boolean,
    expanded: boolean
  ): Promise<Array<{ metric: string; data: TotalMetricResponse }>> => {
    const results = await Promise.all(
      metrics.map(async (metric) => {
        const token = metric.toLowerCase().replace(/\s+/g, "");

        // ✅ Only if no filters are active and metric === 'candidatecalls'
        const hasFilters = Object.values(filters).some(
          (arr) => Array.isArray(arr) && arr.length > 0
        );

        if (!hasFilters && token === "candidatecalls") {
          try {
            const localRes = await fetch(
              `${NEXT_PUBLIC_API_BASE}/api/candidatecalls?datefrom=${start}&dateto=${end}`
            );
            if (localRes.ok) {
              const localData = await localRes.json();
              return { metric: token, data: localData };
            }
          } catch (err) {
            console.warn("Local DB fetch failed, falling back to API:", err);
          }
        }

        // 🌀 Fall back to external API as before
        const q = {
          Function: joinOr(filters.Function, ","),
          dealboard: joinOr(filters.DealboardTeam, "|"),
          office: joinOr(filters.Office, ","),
          region: joinOr(filters.Region, ","),
          revenueStream: joinOr(filters.RevenueStream, ","),
          sector: joinOr(filters.Sector, ","),
          team: joinOr(filters.Team, ","),
        };

        const query = buildQuery({
          metric,
          datefrom: start,
          dateto: end,
          currency: "MYR",
          expanded: expanded ? "ON" : "",
          associated: associated ? "ON" : "",
          output: "total",
          function: q.Function,
          consultant: "",
          dealboard: q.dealboard,
          office: q.office,
          region: q.region,
          revenuestream: q.revenueStream,
          sector: q.sector,
          team: q.team,
        });

        const res = await fetch(`${API_BASE}?${query}`);
        if (!res.ok) throw new Error(`Error fetching metric: ${metric}`);
        const data: TotalMetricResponse = await res.json();
        return { metric, data };
      })
    );
    return results;
  };

  const fetchMetricRowData = async (
    metric: string,
    start: string,
    end: string,
    filters: FiltersShape
  ): Promise<{ metric: string; rowData: RowData[]; headers: string[] }> => {
    const q = {
      Function: joinOr(filters.Function, ","),
      dealboard: joinOr(filters.DealboardTeam, "|"),
      office: joinOr(filters.Office, ","),
      region: joinOr(filters.Region, ","),
      revenueStream: joinOr(filters.RevenueStream, ","),
      consultant: joinOr(filters.Consultant, ","),
      sector: joinOr(filters.Sector, ","),
      team: joinOr(filters.Team, ","),
    };

    const query = buildQuery({
      metric,
      datefrom: start,
      dateto: end,
      currency: "MYR",
      output: "rows",
      function: q.Function,
      consultant: q.consultant,
      dealboard: q.dealboard,
      office: q.office,
      region: q.region,
      revenuestream: q.revenueStream,
      sector: q.sector,
      team: q.team,
    });

    setTabLoading(true);
    setCommonModalOpen(true);

    try {
      const res = await fetch(`${API_BASE}?${query}`);
      if (!res.ok) throw new Error(`Error fetching metric rows: ${metric}`);
      const parsed: RowsResponse = await res.json();

      const rowData: RowData[] = Array.isArray(parsed[""]) ? parsed[""] : [];
      const headers: string[] =
        rowData.length > 0 ? Object.keys(rowData[0] as RowData) : [];

      // cache & present
      setListViewHeader(headers);
      setListViewData(rowData);
      setColumnHeaders(headers);
      setDisplayRowData(rowData);

      return { metric, rowData, headers };
    } catch (err) {
      console.error("Fetch rows error:", err);
      return { metric, rowData: [], headers: [] };
    } finally {
      setTabLoading(false);
    }
  };

  const fetchMetricLeaderboardData = async (
    metric: string,
    start: string,
    end: string,
    filters: FiltersShape
  ): Promise<{ metric: string; rowData: RowData[]; headers: string[] }> => {
    const q = {
      Function: joinOr(filters.Function, ","),
      dealboard: joinOr(filters.DealboardTeam, "|"),
      office: joinOr(filters.Office, ","),
      region: joinOr(filters.Region, ","),
      revenueStream: joinOr(filters.RevenueStream, ","),
      consultant: joinOr(filters.Consultant, ","),
      sector: joinOr(filters.Sector, ","),
      team: joinOr(filters.Team, ","),
    };

    const query = buildQuery({
      metric,
      datefrom: start,
      dateto: end,
      currency: "MYR",
      output: "leaderboard",
      function: q.Function,
      consultant: q.consultant,
      dealboard: q.dealboard,
      office: q.office,
      region: q.region,
      revenuestream: q.revenueStream,
      sector: q.sector,
      team: q.team,
    });

    try {
      const res = await fetch(`${API_BASE}?${query}`);
      if (!res.ok) throw new Error(`Error fetching metric leaderboard: ${metric}`);
      const parsed: RowsResponse = await res.json();

      const rowData: RowData[] = Array.isArray(parsed[""]) ? parsed[""] : [];
      const headers: string[] =
        rowData.length > 0 ? Object.keys(rowData[0] as RowData) : [];

      // cache & present
      setLeaderboardHeader(headers);
      setLeaderboardData(rowData);
      setColumnHeaders(headers);
      setDisplayRowData(rowData);

      return { metric, rowData, headers };
    } catch (err) {
      console.error("Fetch leaderboard error:", err);
      return { metric, rowData: [], headers: [] };
    }
  };

  /* ───────────────────────────── Initialization ──────────────────────────── */

  const initializeData = async (
    overrideFilters?: FiltersShape,
    associated: boolean = isAssociatedModeOn,
    expanded: boolean = isExpandedModeOn
  ): Promise<void> => {
    const { start, end } = getSafeDates();
    const formattedStart = formatDate(start);
    const formattedEnd = formatDate(end);
    const filtersToUse = overrideFilters ?? activeFilters;

    const tokens = selectedMetrics.map(metricToToken);
    setLoadingMetrics(tokens);

    const results = await fetchMetricData(
      tokens,
      formattedStart,
      formattedEnd,
      filtersToUse,
      associated,
      expanded
    );

    const next: MetricDataMap = {};
    // results.forEach(({ metric, data }) => {
    //   next[metric] = {
    //     total: typeof data.total === "number" ? data.total : 0,
    //     target: typeof data.target === "number" ? data.target : 0,
    //   };
    // });
    results.forEach(({ metric, data }) => {
      const key = metricToToken(metric);
      next[key] = {
        total: Number(data.total) || 0,
        target: Number(data.target) || 0,
      };
    });

    setMetricData(next);
    setLoadingMetrics([]);
  };

  /* ───────────────────────────── Handlers ────────────────────────────────── */

  const handleMetricChange = async (metrics: string[]): Promise<void> => {
    const added = metrics.filter((m) => !selectedMetrics.includes(m));
    const formattedAdded = added.map(metricToToken);

    setSelectedMetrics(metrics);

    // rebuild layouts
    const updated: Layouts = { lg: [], md: [], sm: [], xs: [] };
    (Object.keys(cols) as BreakpointKey[]).forEach((bp) => {
      const staticItems = (layouts[bp] ?? []).filter((i) => i.static);
      const dynamic = metrics.map((m, i) => ({
        i: m,
        x: i % (cols[bp] || 1),
        y: Math.floor(i / (cols[bp] || 1)),
        w: 1,
        h: 2,
        static: false,
      }));
      updated[bp] = [...dynamic, ...staticItems];
    });
    setLayouts(updated);

    const { start, end } = getSafeDates();
    const from = formatDate(start);
    const to = formatDate(end);

    setLoadingMetrics((prev) => [...prev, ...formattedAdded]);

    const results = await fetchMetricData(
      formattedAdded,
      from,
      to,
      activeFilters,
      isAssociatedModeOn,
      isExpandedModeOn
    );

    const next: MetricDataMap = { ...metricData };
    results.forEach(({ metric, data }) => {
      next[metric] = {
        total: typeof data.total === "number" ? data.total : 0,
        target: typeof data.target === "number" ? data.target : 0,
      };
    });

    setMetricData(next);
    setLoadingMetrics((prev) => prev.filter((m) => !formattedAdded.includes(m)));
  };

  const handleFixedMetricChange = (metrics: string[]): void => {
    setSelectedFixedMetrics(metrics);

    const updated: Layouts = { lg: [], md: [], sm: [], xs: [] };
    (Object.keys(cols) as BreakpointKey[]).forEach((bp) => {
      const dynamic = (layouts[bp] ?? []).filter((i) => !i.static);
      const fixedItems: Layout[] = metrics.map((metric) => ({
        i: metric,
        x: 0,
        y: selectedMetrics.length,
        w: cols[bp],
        h: 3,
        static: false,
        isResizable: false,
      }));
      updated[bp] = [...dynamic, ...fixedItems];
    });

    setLayouts(updated);
  };

  /* ─────────────────────────── Fixed charts effects ───────────────────────── */

  useEffect(() => {
    const { start, end } = getSafeDates();
    const from = formatDate(start);
    const to = formatDate(end);

    if (
      selectedFixedMetrics.includes("Candidates with multiple interviews (CMI)") &&
      cmiChartData.length === 0
    ) {
      (async () => {
        try {
          setCmiChartLoading(true);
          const res = await fetch(
            `${API_BASE}?metric=candidatesmultipleinterviews&datefrom=${from}&dateto=${to}&output=total&hidetotal=true`
          );
          const data: RowData[] = await res.json();
          setCmiChartData(
            data.map((d) => ({
              ...d,
              Percentage:
                typeof d["Percentage"] === "string"
                  ? parseFloat((d["Percentage"] as string).replace(/[^\d.]/g, ""))
                  : d["Percentage"],
            }))
          );
        } catch (e) {
          console.error("Error fetching CMI chart data:", e);
        } finally {
          setCmiChartLoading(false);
        }
      })();
    }

    if (
      selectedFixedMetrics.includes("A Jobs with multiple interviews (JMI)") &&
      jmiChartData.length === 0
    ) {
      (async () => {
        try {
          setJmiChartLoading(true);
          const res = await fetch(
            `${API_BASE}?metric=jobsmultipleinterviews&datefrom=${from}&dateto=${to}&output=total&hidetotal=true`
          );
          const data: RowData[] = await res.json();
          setJmiChartData(
            data.map((d) => ({
              ...d,
              Percentage:
                typeof d["Percentage"] === "string"
                  ? parseFloat((d["Percentage"] as string).replace(/[^\d.]/g, ""))
                  : d["Percentage"],
            }))
          );
        } catch (e) {
          console.error("Error fetching JMI chart data:", e);
        } finally {
          setJmiChartLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFixedMetrics, dateRange]);

  /* ───────────────────── Load filter options + metrics ───────────────────── */

  useEffect(() => {
    (async () => {
      try {
        const isoToday = new Date().toISOString().slice(0, 10);

        // Filter options seed
        const res = await fetch(
          `${API_BASE}?metric=headcount&datefrom=2025-01-01&dateto=${isoToday}&output=total&hidetotal=true`
        );
        const data: Array<Record<string, string>> = await res.json();

        const fields: Array<keyof FilterOptionsState> = [
          "DealboardTeam",
          "Function",
          "Office",
          "Region",
          "RevenueStream",
          "Sector",
          "Team",
        ];
        const options: Record<string, Set<string>> = {};
        fields.forEach((f) => (options[f] = new Set<string>()));

        data.forEach((item) => {
          fields.forEach((f) => {
            const v = item[f as string];
            if (typeof v === "string" && v.length > 0) options[f].add(v);
          });
        });

        // Consultants
        const consultantRes = await fetch(
          `https://turbine.spencer-ogden.com/ingress/ajax/breadcrumbs.php`
        );
        const consultantData = (await consultantRes.json()) as {
          ActiveConsultantsList?: Array<{ name: string; bullhornID: string }>;
        };
        const consultants =
          consultantData?.ActiveConsultantsList?.map((c) => ({
            label: c.name,
            value: c.bullhornID,
          })) ?? [];

        const parsed = Object.fromEntries(
          Object.entries(options).map(([k, set]) => [k, Array.from(set).sort()])
        ) as Record<keyof FilterOptionsState, string[]>;

        setFilterOptions({
          DealboardTeam: parsed.DealboardTeam ?? [],
          Function: parsed.Function ?? [],
          Office: parsed.Office ?? [],
          Region: parsed.Region ?? [],
          RevenueStream: parsed.RevenueStream ?? [],
          Sector: parsed.Sector ?? [],
          Team: parsed.Team ?? [],
          Consultant: consultants,
        });
      } catch (e) {
        console.error("Error loading filter options:", e);
      }

      await initializeData(activeFilters);

      // reset caches when date/flags/filters change
      setListViewData([]);
      setLeaderboardData([]);
      setLastFetchedListMetric(null);
      setLastFetchedLeaderboardMetric(null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, isAssociatedModeOn, isExpandedModeOn, activeFilters]);

  /* ───────────────────────────── Render helpers ───────────────────────────── */

  const renderMetricBox = (metric: string, isFixed: boolean): React.ReactElement => {
    const trimmed = metricToToken(metric);
    const isLoading = loadingMetrics.includes(trimmed);
    const data = metricData[trimmed] ?? { total: 0, target: 0 };
    const layoutItem = layouts.lg?.find((i) => i.i === metric);
    const showChart = !!layoutItem && layoutItem.h >= 2;

    // Fixed: CMI
    if (isFixed && metric === "Candidates with multiple interviews (CMI)") {
      return (
        <div key={metric} className="bg-white text-black rounded shadow p-4 flex flex-col">
          <div className="text-lg font-semibold mb-2">{metric}</div>
          {cmiChartLoading ? (
            <div className="text-sm text-gray-500">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cmiChartData as Array<Record<string, number | string>>}>
                <XAxis dataKey="YearMonth" />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  domain={[0, "auto"]}
                  label={{ value: "Total", angle: -90, position: "insideLeft" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  label={{ value: "Percentage", angle: -90, position: "insideRight" }}
                />
                <Tooltip
                  formatter={(value: unknown, name: string) =>
                    name === "Percentage" ? `${value as number}%` : (value as number)
                  }
                />
                <Legend />
                <Bar yAxisId="left" dataKey="TotalCandidates" fill="#4f46e5" name="Total Candidates" barSize={40} />
                <Bar yAxisId="right" dataKey="Percentage" fill="#10b981" name="Percentage" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      );
    }

    // Fixed: JMI
    if (isFixed && metric === "A Jobs with multiple interviews (JMI)") {
      return (
        <div key={metric} className="bg-white text-black rounded shadow p-4 flex flex-col">
          <div className="text-lg font-semibold mb-2">{metric}</div>
          {jmiChartLoading ? (
            <div className="text-sm text-gray-500">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jmiChartData as Array<Record<string, number | string>>}>
                <XAxis dataKey="YearMonth" />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  domain={[0, "auto"]}
                  label={{ value: "Total", angle: -90, position: "insideLeft" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  label={{ value: "Percentage", angle: -90, position: "insideRight" }}
                />
                <Tooltip
                  formatter={(value: unknown, name: string) =>
                    name === "Percentage" ? `${value as number}%` : (value as number)
                  }
                />
                <Legend />
                <Bar yAxisId="left" dataKey="TotalCandidates" fill="#CD5C5C" name="Total Candidates" barSize={40} />
                <Bar yAxisId="right" dataKey="Percentage" fill="#228B22" name="Percentage" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      );
    }

    // Default card
    return (
      <div
        key={metric}
        className="bg-blue-500 text-white rounded shadow relative flex items-center justify-center"
      >
        <div className="text-center px-2">
          {showChart && <MetricProgressChart total={data.total} target={data.target} />}
          <div className="text-lg font-bold">{metric}</div>
          <div>Total: {isLoading ? "…" : data.total}</div>
          <div>Target: {isLoading ? "…" : data.target}</div>
          <button
            className="mt-2 bg-blue-700 px-2 py-1 rounded hover:bg-blue-800 text-sm"
            onClick={async () => {
              const { start, end } = getSafeDates();
              const from = formatDate(start);
              const to = formatDate(end);
              await fetchMetricRowData(metricToToken(metric), from, to, activeFilters);
            }}
          >
            View Details
          </button>
        </div>
      </div>
    );
  };

  /* ───────────────────────────────── Render ───────────────────────────────── */

  return (
    <div className="bg-black min-h-screen text-white">
      <Sidebar
        isMobileOpen={isMobileOpen}
        setMobileOpen={setMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="lg:ml-64 p-4">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 text-white rounded bg-gray-800 hover:bg-gray-700"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          <MetricSelector
            selectedMetrics={selectedMetrics}
            selectedFixedMetrics={selectedFixedMetrics}
            onChangeResizable={handleMetricChange}
            onChangeFixed={handleFixedMetricChange}
          />

          <button
            onClick={() => setFilterOpen(true)}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Filters
          </button>

          {/* Date picker with strict, explicit onChange */}
          <DateRangePicker onChange={(range) => setDateRange(range)} />
        </div>

        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <DropdownSettings
            onAssociatedModeClick={() => setIsAssociatedModalOpen(true)}
            onExpandedModeClick={() => setIsExpandedModalOpen(true)}
          />
        </div>

        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={120}
          isDraggable
          isResizable
          useCSSTransforms
          compactType="vertical"
          draggableCancel=".no-drag"
          onLayoutChange={(_layout, allLayouts) => setLayouts(allLayouts)}
          resizeHandles={[]} // Disable all resize handles
        >
          {selectedMetrics.map((metric) => renderMetricBox(metric, false))}
          {selectedFixedMetrics.map((metric) => renderMetricBox(metric, true))}
        </ResponsiveGridLayout>

        {/* Modals */}
        <FilterModal
          isOpen={isFilterOpen}
          onClose={() => setFilterOpen(false)}
          options={filterOptions}
          onApply={async (filters: FiltersShape) => {
            setActiveFilters(filters);
            await initializeData(filters);
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
      </div>

      {/* Common Modal with Tabs + Table */}
      <CommonModal isOpen={isCommonModalOpen} onClose={() => setCommonModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-blue-700 mb-4"></h2>

          {/* Tabs + Search */}
          <div className="flex items-end justify-between border-b mb-4 gap-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 rounded text-black"
              />
            </div>

            <div className="flex space-x-4">
              {(["List view", "Trends", "Leaderboard"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={async () => {
                    setActiveTab(tab);
                    const { start, end } = getSafeDates();
                    const from = formatDate(start);
                    const to = formatDate(end);
                    const currentMetric = metricToToken(selectedMetrics[0]);

                    if (tab === "List view") {
                      const needsFetch =
                        listViewData.length === 0 || lastFetchedListMetric !== currentMetric;

                      if (needsFetch) {
                        setTabLoading(true);
                        const { rowData, headers } = await fetchMetricRowData(
                          currentMetric,
                          from,
                          to,
                          activeFilters
                        );
                        setDisplayRowData(rowData);
                        setColumnHeaders(headers);
                        setTabLoading(false);
                        setLastFetchedListMetric(currentMetric);
                      } else {
                        setDisplayRowData(listViewData);
                        setColumnHeaders(listViewHeader);
                      }
                    }

                    if (tab === "Leaderboard") {
                      const needsFetch =
                        leaderboardData.length === 0 ||
                        lastFetchedLeaderboardMetric !== currentMetric;

                      if (needsFetch) {
                        setTabLoading(true);
                        const { rowData, headers } = await fetchMetricLeaderboardData(
                          currentMetric,
                          from,
                          to,
                          activeFilters
                        );
                        setDisplayRowData(rowData);
                        setColumnHeaders(headers);
                        setTabLoading(false);
                        setLastFetchedLeaderboardMetric(currentMetric);
                      } else {
                        setDisplayRowData(leaderboardData);
                        setColumnHeaders(leaderboardHeader);
                      }
                    }
                  }}
                  className={`px-4 py-2 border-b-2 transition text-black ${
                    activeTab === tab
                      ? "text-blue-600 border-blue-500 font-semibold"
                      : "border-transparent hover:text-blue-600 hover:border-blue-500"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {tabLoading && <div className="text-black my-4">Loading...</div>}
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto border rounded">
            <table className="min-w-full table-auto text-sm text-left">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  {columnHeaders.map((header) => (
                    <th key={header} className="px-4 py-2 capitalize whitespace-nowrap text-black">
                      {header.replace(/([A-Z])/g, " $1")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <tr
                    key={index}
                    className="hover:bg-blue-50 cursor-pointer border-b"
                    onClick={() => console.log("Clicked:", row)}
                  >
                    {columnHeaders.map((col) => (
                      <td key={col} className="px-4 py-2 whitespace-nowrap text-black">
                        {String((row as Record<string, unknown>)[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center mt-4 space-x-2 text-sm">
            <button
              className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50 text-black"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="px-2 text-black">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50 text-black"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </CommonModal>
    </div>
  );
}
