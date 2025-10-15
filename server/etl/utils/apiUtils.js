// server/etl/utils/apiUtils.js
import fetch from "node-fetch";
import { getOrCreateDimension } from "./dimensionUtils.js";

export async function processCombination(conn, metric, date, region, office, func, dealboard, sector, rev, consultant) {
  const url = `https://so-api.azurewebsites.net/ingress/ajax/api?metric=${metric}&datefrom=${date}&dateto=${date}&region=${region}&office=${office}&function=${func}&dealboard=${dealboard}&sector=${sector}&revenuestream=${rev}&consultant=${consultant}&output=total`;

  const res = await fetch(url);
  const data = await res.json();

  const metricId = await getOrCreateDimension(conn, "dim_metric", "metric_name", metric);
  const regionId = await getOrCreateDimension(conn, "dim_region", "region_name", region);
  const officeId = await getOrCreateDimension(conn, "dim_office", "office_name", office);
  const functionId = await getOrCreateDimension(conn, "dim_function", "function_name", func);
  const dealboardId = await getOrCreateDimension(conn, "dim_dealboard", "dealboard_name", dealboard);
  const sectorId = await getOrCreateDimension(conn, "dim_sector", "sector_name", sector);
  const revenueStreamId = await getOrCreateDimension(conn, "dim_revenue_stream", "revenue_stream_name", rev);
  const consultantId = await getOrCreateDimension(conn, "dim_consultant", "consultant_name", consultant);

  return [
    date,
    metricId,
    regionId,
    officeId,
    functionId,
    dealboardId,
    sectorId,
    revenueStreamId,
    consultantId,
    data.total || 0,
    data.target || null,
  ];
}

export async function processInBatches(tasks, maxConcurrency, conn) {
  const results = [];
  let index = 0;

  while (index < tasks.length) {
    const chunk = tasks.slice(index, index + maxConcurrency);
    const batchResults = await Promise.allSettled(chunk.map((fn) => fn(conn)));
    results.push(
      ...batchResults
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value)
    );
    index += maxConcurrency;
    console.log(`🚀 Progress: ${index}/${tasks.length} (${((index / tasks.length) * 100).toFixed(1)}%)`);
  }

  return results;
}
