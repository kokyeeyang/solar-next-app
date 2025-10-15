// server/etl/jobs/candidateCallsETL.js
import fetch from "node-fetch";
import { reportingDB } from "../../db/connection.js";

/**
 * 📆 Get Jan 1 of current year and today's date dynamically
 */
function getDateRange() {
  const start = new Date(new Date().getFullYear(), 0, 1); // Jan 1 of this year
  const end = new Date(); // today
  const dates = [];

  let current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * 📡 Fetch metric data for a single date (datefrom == dateto)
 */
async function fetchMetricForDate(metric, date) {
  const url = `https://so-api.azurewebsites.net/ingress/ajax/api?metric=${metric}&datefrom=${date}&dateto=${date}&currency=MYR&output=total`;

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
    };
  } catch (err) {
    console.error(`❌ Failed to fetch ${metric} on ${date}:`, err.message);
    return null;
  }
}

/**
 * 🗄️ Insert a batch of rows into MySQL
 */
async function insertMetricsBatch(conn, rows) {
  if (rows.length === 0) return;

  const values = rows.map(r => [
    r.metric_name,
    r.metric_date,
    r.metric_value,
    r.target_value,
    "MYR"
  ]);

  await conn.query(
    `
    INSERT INTO daily_metrics (
      metric_name,
      metric_date,
      metric_value,
      target_value,
      currency
    )
    VALUES ?
    ON DUPLICATE KEY UPDATE
      metric_value = VALUES(metric_value),
      target_value = VALUES(target_value)
    `,
    [values]
  );
}

/**
 * 🚀 Run ETL for candidatecalls metric (daily granularity)
 */
export async function runCandidateCallsETL() {
  console.log("📊 Starting candidatecalls ETL job...");
  const conn = await reportingDB.getConnection();

  try {
    await conn.beginTransaction();

    const dates = getDateRange();
    console.log(`📆 Processing ${dates.length} days from ${dates[0]} to ${dates[dates.length - 1]}...`);

    const BATCH_SIZE = 100; // API and DB-friendly chunk size
    const allRows = [];

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const row = await fetchMetricForDate("candidatecalls", date);
      if (row) allRows.push(row);

      // 🚀 Insert every BATCH_SIZE days
      if (allRows.length >= BATCH_SIZE || i === dates.length - 1) {
        await insertMetricsBatch(conn, allRows);
        console.log(`✅ Inserted ${allRows.length} rows so far...`);
        allRows.length = 0; // clear batch
      }
    }

    await conn.commit();
    console.log("🎉 ETL completed successfully!");
  } catch (err) {
    await conn.rollback();
    console.error("❌ ETL failed:", err);
  } finally {
    conn.release();
  }
}
