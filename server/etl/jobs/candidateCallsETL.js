// server/etl/jobs/candidateCallsETL.js
import { reportingDB } from "../../db/connection.js";
import {
  START_DATE,
  END_DATE,
  MAX_CONCURRENCY,
  BATCH_SIZE,
} from "../ETLConfig.js";
import { processInBatches } from "../utils/apiUtils.js";
import { batchInsertFacts } from "../utils/dbUtils.js";
import fetch from "node-fetch";

// 📆 Helper: build date range
function getDateRange(start, end) {
  const dates = [];
  let current = new Date(start);
  while (current <= new Date(end)) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// 📡 API request for a single date (no filters)
async function processMetricForDate(conn, metric, date) {
  const params = new URLSearchParams();
  params.append("metric", metric);
  params.append("datefrom", date);
  params.append("dateto", date);
  params.append("currency", "MYR");
  params.append("output", "total");

  const url = `https://so-api.azurewebsites.net/ingress/ajax/api?${params.toString()}`;

  try {
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      console.error(`❌ API error ${res.status} for ${metric} on ${date}`);
      console.error("Response:", text.slice(0, 200));
      return null;
    }

    const data = JSON.parse(text);

    return {
      metric_name: metric,
      metric_date: date,
      metric_value: data.total || 0,
      target_value: data.target || null,
      currency: "MYR",
      created_at: new Date(),
    };
  } catch (err) {
    console.error(`❌ Failed for ${metric} on ${date}:`, err.message);
    return null;
  }
}

// 🛠️ Main ETL job
export async function runCandidateCallsETL() {
  const conn = await reportingDB.getConnection();
  console.log("📊 Running ETL for candidatecalls (no filters)...");

  try {
    await conn.beginTransaction();
    const dates = getDateRange(START_DATE, END_DATE);
    const tasks = [];

    for (const date of dates) {
      tasks.push(() => processMetricForDate(conn, "candidatecalls", date));
    }

    console.log(`📦 Total tasks prepared: ${tasks.length}`);

    // 🚀 Run in parallel
    const rows = await processInBatches(tasks, MAX_CONCURRENCY, conn);
    console.log(`✅ Total rows fetched: ${rows.length}`);

    // 🗄️ Bulk insert into DB
    await batchInsertFacts(conn, rows, BATCH_SIZE);

    await conn.commit();
    console.log("🎉 candidatecalls ETL completed successfully.");
  } catch (err) {
    await conn.rollback();
    console.error("❌ ETL failed:", err);
  } finally {
    conn.release();
  }
}
