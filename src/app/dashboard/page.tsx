// Filename: DashboardPage.tsx

"use client";

import {BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import Sidebar from "../../../components/Sidebar";
import MetricSelector from "../../../components/MetricSelector";
import DateRangePicker from "../../../components/DatePicker";
import FilterModal from "../../../components/FilterModal";
import MetricProgressChart from "../../../components/MetricProgressChart";
import DropdownSettings from "../../../components/DropdownSettings";
import ToggleModal from "../../../components/ToggleModal";
import ExpandedModeModal from "../../../components/ExpandedModeModal";
import CommonModal from "../../../components/CommonModal";

import { useEffect, useState } from "react";
import { Responsive, WidthProvider, Layouts, Layout } from "react-grid-layout";
import { Bars3Icon } from "@heroicons/react/24/solid";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const defaultMetrics = [
  "Candidate Calls",
  "Candidates Added",
  "Jobs Added",
];

const fixedMetric = "Candidates with multiple interviews (CMI)";
const breakpoints = { lg: 1280, md: 1024, sm: 768, xs: 0 };
const cols = { lg: 5, md: 3, sm: 2, xs: 1 };

export default function DashboardPage() {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [selectedMetrics, setSelectedMetrics] = useState(defaultMetrics);
  // const [selectedFixedMetrics, setSelectedFixedMetrics] = useState<string[]>([]);
  const [selectedFixedMetrics, setSelectedFixedMetrics] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date]>([startOfYear, today]);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [isAssociatedModalOpen, setIsAssociatedModalOpen] = useState(false);
  const [isAssociatedModeOn, setIsAssociatedModeOn] = useState(false);

  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);
  const [isExpandedModeOn, setIsExpandedModeOn] = useState(false);

  const [isCommonModalOpen, setCommonModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("List view");
  const [tabLoading, setTabLoading] = useState(false);
  const [listViewData, setListViewData] = useState<any[]>([]);
  const [listViewHeader, setListViewHeader] = useState<string[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardHeader, setLeaderboardHeader] = useState<any[]>([]);
  const [lastFetchedListMetric, setLastFetchedListMetric] = useState<string | null>(null);
  const [lastFetchedLeaderboardMetric, setLastFetchedLeaderboardMetric] = useState<string | null>(null);  

  const [cmiChartData, setCmiChartData] = useState<{ month: string; count: number}[]>([]);
  const [cmiChartLoading, setCmiChartLoading] = useState(false);
  const [jmiChartData, setJmiChartData] = useState<{ month: string; count: number}[]>([]);
  const [jmiChartLoading, setJmiChartLoading] = useState(false);

  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [loadingMetrics, setLoadingMetrics] = useState<string[]>([]);
  const [displayRowData, setDisplayRowData] = useState<Record<string, any>[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 30;
  const [searchTerm, setSearchTerm] = useState("");
  const filteredData = displayRowData.filter((row) =>
    Object.values(row).join("").toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, displayRowData]);
  
  const [metricData, setMetricData] = useState<Record<string, { total: number; target: number }>>({});

   const createInitialLayout = (breakpoint: keyof typeof cols): Layout[] => {
      const layout: Layout[] = [];

      defaultMetrics.forEach((metric, index) => {
        layout.push({
          i: metric,
          x: index % cols[breakpoint],
          y: Math.floor(index / cols[breakpoint]),
          w: 1,
          h: 2,
          static: false,
        });
      });

      layout.push({
        i: fixedMetric,
        x: 0,
        y: 100,
        w: cols[breakpoint],
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
    }))
    useEffect(() => {
      console.log("LAYOUTS updated:", layouts);
      console.log("Current layout lg:", layouts.lg?.map(i => i.i));
    }, [layouts]);



    // const initial = defaultMetrics.map((metric, index) => ({
    //   i: metric,
    //   x: index % 5,
    //   y: Math.floor(index / 5),
    //   w: 1,
    //   h: 2,
    // }));
    // return { lg: initial, md: initial, sm: initial, xs: initial };
  // });

  const [filterOptions, setFilterOptions] = useState({
    DealboardTeam: [] as string[],
    Function: [] as string[],
    Office: [] as string[],
    Region: [] as string[],
    RevenueStream: [] as string[],
    Sector: [] as string[],
    Team: [] as string[],
    Consultant: [] as { label: string; value: string }[]
  });

  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const fetchMetricData = async (
    metrics: string[],
    start: string,
    end: string,
    filters: Record<string, string[]>,
    associated: boolean,
    expanded: boolean
  ) => {
    const results = await Promise.all(
      metrics.map(async (metric) => {
        const q = {
          Function: filters.Function?.join(",") || "",
          dealboard: filters.DealboardTeam?.join("|") || "",
          office: filters.Office?.join(",") || "",
          region: filters.Region?.join(",") || "",
          revenueStream: filters.RevenueStream?.join(",") || "",
          sector: filters.Sector?.join(",") || "",
          team: filters.Team?.join(",") || "",
        };

        const query = new URLSearchParams({
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

        const res = await fetch(`https://so-api.azurewebsites.net/ingress/ajax/api?${query.toString()}`);
        if (!res.ok) throw new Error(`Error fetching metric: ${metric}`);

        const data = await res.json();
        return { metric, data };
      })
    );
    return results;
  };

  const fetchMetricRowData = async (
    metric: string,
    start: string,
    end: string,
    filters: Record<string, string[]>
  ) => {
    const q = {
      Function: filters.Function?.join(",") || "",
      dealboard: filters.DealboardTeam?.join("|") || "",
      office: filters.Office?.join(",") || "",
      region: filters.Region?.join(",") || "",
      revenueStream: filters.RevenueStream?.join(",") || "",
      consultant: filters.Consultant?.join(",") || "",
      sector: filters.Sector?.join(",") || "",
      team: filters.Team?.join(",") || "",
    };

    const rowQuery = new URLSearchParams({
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
    const url = `https://so-api.azurewebsites.net/ingress/ajax/api?${rowQuery.toString()}`;

    try {
      const rowRes = await fetch(url);
      if (!rowRes.ok) throw new Error(`Error fetching metric row: ${metric}`);
      const { total, "":rowData} = await rowRes.json();
      // console.log("hello = ", rowData);
      let headers = rowData.length > 0 ? Object.keys(rowData[0]) : [];

      setListViewHeader(headers);
      setListViewData(rowData);

      setColumnHeaders(headers);
      setDisplayRowData(rowData);

      return { metric, rowData, headers: headers ?? [] };
    } catch (error) {
      console.error("Fetch error:", error);
      return { metric, rowData: [], headers: [] }; // return empty array on error
    }
  };

  const fetchMetricLeaderboardData = async (
    metric: string,
    start: string,
    end: string,
    filters: Record<string, string[]>
  ) => {
    const q = {
      Function: filters.Function?.join(",") || "",
      dealboard: filters.DealboardTeam?.join("|") || "",
      office: filters.Office?.join(",") || "",
      region: filters.Region?.join(",") || "",
      revenueStream: filters.RevenueStream?.join(",") || "",
      consultant: filters.Consultant?.join(",") || "",
      sector: filters.Sector?.join(",") || "",
      team: filters.Team?.join(",") || "",
    };

    const rowQuery = new URLSearchParams({
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

    // setCommonModalOpen(true);
    const url = `https://so-api.azurewebsites.net/ingress/ajax/api?${rowQuery.toString()}`;

    try {
      const rowRes = await fetch(url);
      if (!rowRes.ok) throw new Error(`Error fetching metric row: ${metric}`);
      const { total, "":rowData} = await rowRes.json();
      // console.log("hello = ", rowData);
      let headers = rowData.length > 0 ? Object.keys(rowData[0]) : [];
      // console.log("Headers:", headers);

      setLeaderboardHeader(headers);
      setLeaderboardData(rowData);

      setColumnHeaders(headers);
      setDisplayRowData(rowData);

      console.log("Leaderboard data:", rowData);

      return { metric, rowData, headers: headers ?? [] };
    } catch (error) {
      console.error("Fetch error:", error);
      return { metric, rowData: [], headers: [] }; // return empty array on error
    }
  };

  const initializeData = async (overrideFilters: Record<string, string[]>, associated: boolean = isAssociatedModeOn, expanded: boolean = isExpandedModeOn) => {
    const start = dateRange[0];
    const end = dateRange[1];
    if (!start || !end) return;

    const formattedStart = formatDate(start);
    const formattedEnd = formatDate(end);
    const filtersToUse = overrideFilters || activeFilters;

    const formattedMetrics = selectedMetrics.map((m) => m.toLowerCase().replace(/\s+/g, ""));
    setLoadingMetrics(formattedMetrics);

    const results = await fetchMetricData(formattedMetrics, formattedStart, formattedEnd, filtersToUse, associated, expanded);
    const updatedData: Record<string, { total: number; target: number }> = {};
    results.forEach(({ metric, data }) => {
      updatedData[metric] = {
        total: data?.total ?? 0,
        target: data?.target ?? 0,
      };
    });
    setMetricData(updatedData);
    setLoadingMetrics([]);
  };
  
  const handleMetricChange = async (metrics: string[]) => {
    const added = metrics.filter((m) => !selectedMetrics.includes(m));
    const formattedAdded = added.map((m) => m.toLowerCase().replace(/\s+/g, ""));

    setSelectedMetrics(metrics);
    const updatedLayouts: Layouts = {
      lg: [],
      md: [],
      sm: [],
      xs: []
    };

    Object.entries(layouts).forEach(([breakpoint, layout]) => {
      const staticItems = layout.filter((item) => item.static);
      const dynamicItems = metrics.map((m, i) => ({
        i: m,
        x: i % (cols[breakpoint as keyof typeof cols] || 1),
        y: Math.floor(i / (cols[breakpoint as keyof typeof cols] || 1)),
        w: 1,
        h: 2,
        static: false,
      }));
      updatedLayouts[breakpoint as keyof Layouts] = [...dynamicItems, ...staticItems];
    });


    setLayouts(updatedLayouts);

    const start = dateRange[0];
    const end = dateRange[1];
    if (!start || !end) return;

    const formattedStart = formatDate(start);
    const formattedEnd = formatDate(end);

    setLoadingMetrics((prev) => [...prev, ...formattedAdded]);

    const results = await fetchMetricData(formattedAdded, formattedStart, formattedEnd, activeFilters, isAssociatedModeOn, isExpandedModeOn);
    const updatedData = { ...metricData };
    results.forEach(({ metric, data }) => {
      updatedData[metric] = {
        total: data?.total ?? 0,
        target: data?.target ?? 0,
      };
    });
    setMetricData(updatedData);
    setLoadingMetrics((prev) => prev.filter((m) => !formattedAdded.includes(m)));
  };

  const handleFixedMetricChange = (metrics: string[]) => {
    setSelectedFixedMetrics(metrics);

    const updatedLayouts: Layouts = {
      lg: [],
      md: [],
      sm: [],
      xs: [],
    };

    Object.keys(cols).forEach((breakpointKey) => {
      const bp = breakpointKey as keyof typeof cols;
      const existingDynamic = layouts[bp].filter(item => !item.static);

      const fixedItems: Layout[] = metrics.map((metric) => ({
        i: metric,
        x: 0,
        y: selectedMetrics.length,
        w: cols[bp],
        h: 3,
        static: false,
        isResizable: false
      }));

      updatedLayouts[bp] = [...existingDynamic, ...fixedItems];
    });

    setLayouts(updatedLayouts);
  };


  const renderMetricBox = (metric: string, isFixed: boolean) => {
    const trimmed = metric.toLowerCase().replace(/\s+/g, "");
    const isLoading = loadingMetrics.includes(trimmed);
    const data = metricData[trimmed] || { total: 0, target: 0 };
    const layoutItem = layouts.lg?.find(item => item.i === metric);
    const showChart = layoutItem && layoutItem.h >= 2;

    if (isFixed && metric === "Candidates with multiple interviews (CMI)") {
      return (
        <div key={metric} className="bg-white text-black rounded shadow p-4 flex flex-col">
          <div className="text-lg font-semibold mb-2">{metric}</div>

          {cmiChartLoading ? (
            <div className="text-sm text-gray-500">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cmiChartData}>
                <XAxis dataKey="YearMonth" />
                <YAxis yAxisId="left" orientation="left" domain={[0,'auto']} label={{ value: "Total", angle: -90, position: "insideLeft" }}/>
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]} // assumes percentages are like 44.5
                  tickFormatter={(v) => `${v}%`}
                  label={{ value: "Percentage", angle: -90, position: "insideRight" }}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    return name === "Percentage" ? `${value}%` : value;
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="TotalCandidates" fill="#4f46e5" name="Total Candidates" barSize={40}/>
                <Bar yAxisId="right" dataKey="Percentage" fill="#10b981" name="Percentage" barSize={20}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      );
    } else if (isFixed && metric === "A Jobs with multiple interviews (JMI)") {
      return (
        <div key={metric} className="bg-white text-black rounded shadow p-4 flex flex-col">
          <div className="text-lg font-semibold mb-2">{metric}</div>

          {jmiChartLoading ? (
            <div className="text-sm text-gray-500">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jmiChartData}>
                <XAxis dataKey="YearMonth" />
                <YAxis yAxisId="left" orientation="left" domain={[0,'auto']} label={{ value: "Total", angle: -90, position: "insideLeft" }}/>
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]} // assumes percentages are like 44.5
                  tickFormatter={(v) => `${v}%`}
                  label={{ value: "Percentage", angle: -90, position: "insideRight" }}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    return name === "Percentage" ? `${value}%` : value;
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="TotalCandidates" fill="#CD5C5C" name="Total Candidates" barSize={40}/>
                <Bar yAxisId="right" dataKey="Percentage" fill="#228B22" name="Percentage" barSize={20}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      );
    }

    // default box for resizable metrics or others
    return (
      <div
        key={metric}
        className="bg-blue-500 text-white rounded shadow relative flex items-center justify-center"
      >
        <div className="text-center px-2">
          {showChart && (
            <MetricProgressChart total={data.total} target={data.target} />
          )}
          <div className="text-lg font-bold">{metric}</div>
          <div>Total: {data.total}</div>
          <div>Target: {data.target}</div>
          <button
            className="mt-2 bg-blue-700 px-2 py-1 rounded hover:bg-blue-800 text-sm"
            onClick={() =>
              fetchMetricRowData(trimmed, formatDate(dateRange[0]), formatDate(dateRange[1]), activeFilters)
            }
          >
            View Details
          </button>
        </div>
      </div>
    );
  };


  useEffect(() => {
    console.log("selectedFixedMetrics: ", selectedFixedMetrics);
    if (selectedFixedMetrics.includes("Candidates with multiple interviews (CMI)") && cmiChartData.length === 0) {
      const fetchData = async () => {
        try {
          setCmiChartLoading(true);
          const from = formatDate(dateRange[0]);
          const to = formatDate(dateRange[1]);
          const res = await fetch(
            `https://so-api.azurewebsites.net/ingress/ajax/api?metric=candidatesmultipleinterviews&datefrom=${from}&dateto=${to}&output=total&hidetotal=true`
          );
          const data = await res.json();
          // setCmiChartData(data);
          setCmiChartData(
            data.map((d: any) => ({
              ...d,
              Percentage: parseFloat(
                typeof d.Percentage === "string"
                  ? d.Percentage.replace(/[^\d.]/g, "") // remove everything except digits and dot
                  : d.Percentage
              ),
            }))
          );
          
        } catch (error){
          console.error("Error fetching CMI chart data: ", error);
        } finally {
          setCmiChartLoading(false);
        }
      };
      fetchData();
    } else if (selectedFixedMetrics.includes("A Jobs with multiple interviews (JMI)") && jmiChartData.length === 0) {
      const fetchData = async () => {
        try {
          setJmiChartLoading(true);
          const from = formatDate(dateRange[0]);
          const to = formatDate(dateRange[1]);
          const res = await fetch(
            `https://so-api.azurewebsites.net/ingress/ajax/api?metric=jobsmultipleinterviews&datefrom=${from}&dateto=${to}&output=total&hidetotal=true`
          );
          const data = await res.json();
          // setJmiChartData(data);
          setJmiChartData(data.map((d: any) => ({
            ...d,
            Percentage: parseFloat(
              typeof d.Percentage === "string"
                ? d.Percentage.replace(/[^\d.]/g, "") // remove everything except digits and dot
                : d.Percentage
            ),
          })));
        } catch (error){
          console.error("Error fetching JMI chart data: ", error);
        } finally {
          setJmiChartLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedFixedMetrics, dateRange])
  useEffect(() => {
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
    // loadConsultantOptions();
    initializeData(activeFilters);

    setListViewData([]);
    setLeaderboardData([]);
    setLastFetchedListMetric(null);
    setLastFetchedLeaderboardMetric(null);
  }, [dateRange, isAssociatedModeOn, isExpandedModeOn, activeFilters]);

  console.log("LAYOUTS:", layouts);
console.log("Current layout lg:", layouts.lg?.map(i => i.i));
  return (
    <div className="bg-black min-h-screen text-white">
      <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen} />

      <div className="lg:ml-64 p-4">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 text-white rounded bg-gray-800 hover:bg-gray-700"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <MetricSelector selectedMetrics={selectedMetrics} selectedFixedMetrics={selectedFixedMetrics} onChangeResizable={handleMetricChange} onChangeFixed={handleFixedMetricChange} />
          <button
            onClick={() => setFilterOpen(true)}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Filters
          </button>
          <DateRangePicker onChange={setDateRange} />
        </div>
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <DropdownSettings 
          onAssociatedModeClick={() => setIsAssociatedModalOpen(true)} 
          onExpandedModeClick={() => setIsExpandedModalOpen(true)} />
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
          onLayoutChange={(layout, allLayouts) => setLayouts(allLayouts)}
          resizeHandles={[]} // Disable all resize handles
        >
          {selectedMetrics.map((metric) => renderMetricBox(metric, false))}
          {selectedFixedMetrics.map((metric) => renderMetricBox(metric, true))}

        </ResponsiveGridLayout>

        <FilterModal
          isOpen={isFilterOpen}
          onClose={() => setFilterOpen(false)}
          options={filterOptions}
          onApply={async (filters) => {
            setActiveFilters(filters);
            await initializeData(filters);
          }}
        />
        <ToggleModal
          isOpen={isAssociatedModalOpen}
          onClose={() => setIsAssociatedModalOpen(false)}
          isOn={isAssociatedModeOn}
          toggleSwitch={
            () => {
              setIsAssociatedModeOn((prev) => !prev);
            }
          }
        />
        <ExpandedModeModal
          isOpen={isExpandedModalOpen}
          onClose={() => setIsExpandedModalOpen(false)}
          isOn={isExpandedModeOn}
          toggleSwitch={
            () => {
              setIsExpandedModeOn((prev) => !prev);
            }
          }
        />
      </div>
      <CommonModal isOpen={isCommonModalOpen} onClose={() => setCommonModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-blue-700 mb-4"></h2>

          {/* Tabs */}
          <div className="flex space-x-4 border-b mb-4">
            <div className="mb-4">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }} className="w-full p-2 border border-gray-300 rounded text-black">
              </input>
            </div>
            {['List view', 'Trends', 'Leaderboard'].map((tab) => (
              <button
                key={tab}
                onClick={async () => {
                  setActiveTab(tab);
                  const start = formatDate(dateRange[0]);
                  const end = formatDate(dateRange[1]);
                  const currentMetric = selectedMetrics[0].toLowerCase().replace(/\s+/g, "");

                  if (tab === "List view") {

                    const needsFetch = listViewData.length === 0 || lastFetchedListMetric !== currentMetric;

                    if(needsFetch){

                      setTabLoading(true);
                      const { rowData, headers } = await fetchMetricRowData(
                        selectedMetrics[0].toLowerCase().replace(/\s+/g, ""),
                        start,
                        end,
                        activeFilters
                      );
                      setDisplayRowData(rowData);
                      setColumnHeaders(headers);
                      setTabLoading(false);
                      setLastFetchedListMetric(currentMetric);
                    } else {
                      // If we don't need to fetch, we can use the existing data
                      setDisplayRowData(listViewData);
                      setColumnHeaders(listViewHeader);
                    }
                  }

                  if (tab === "Leaderboard") {
                    const needsFetch = leaderboardData.length === 0 || lastFetchedLeaderboardMetric !== currentMetric;

                    if(needsFetch){
                      setTabLoading(true);
                      const { rowData, headers } = await fetchMetricLeaderboardData(
                        selectedMetrics[0].toLowerCase().replace(/\s+/g, ""),
                        start,
                        end,
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

          {/* Table */}
          {tabLoading && <div className="text-black my-4">Loading...</div>}
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto border rounded">
            <table className="min-w-full table-auto text-sm text-left">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  {columnHeaders.map((header, idx) => (
                    <th key={idx} className="px-4 py-2 capitalize whitespace-nowrap text-black">
                      {header.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* {displayRowData.map((row, index) => { */}
                {paginatedData.map((row, index) => {
                  // console.log('row is plain object:', Object.prototype.toString.call(row)); 
                  return (
                    <tr
                    key={index}
                    className="hover:bg-blue-50 cursor-pointer border-b"
                      onClick={() => console.log('Clicked:', row)}
                    >
                      {columnHeaders.map((col, colIdx) => (
                        <td key={colIdx} className="px-4 py-2 whitespace-nowrap text-black">
                          {/* {row[col as keyof typeof row]} */}
                          {String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination (Optional) */}
          <div className="flex justify-center items-center mt-4 space-x-2 text-sm">
            <button className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50 text-black" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</button>
            <span className="px-2 text-black">
              Page {currentPage} of {Math.ceil(filteredData.length / rowsPerPage)}
            </span>
            <button className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50 text-black" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} 
              disabled={currentPage >= Math.ceil(filteredData.length/rowsPerPage)}>Next</button>
          </div>
        </div>
      </CommonModal>
    </div>
    
  );
}
