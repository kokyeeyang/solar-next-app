// server/etl/jobs/candidatesNotContacted30DaysETL.js
import fetch from "node-fetch";
import { reportingDB } from "../../db/connection.js";

/**
 * 📆 Build date range between startDate and endDate (inclusive)
 */
function getDateRange(startDate, endDate) {
  const dates = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * 📡 Fetch metric data for a single day (datefrom == dateto)
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
      currency: "MYR",
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
    r.currency,
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
 * 🚀 ETL Job – candidatesNotContacted30Days
 * @param {string} startDate - ISO date (YYYY-MM-DD)
 * @param {string} endDate - ISO date (YYYY-MM-DD)
 */
export async function runCandidatesNotContacted30DaysETL(startDate, endDate) {
  console.log(`📊 Starting ETL for ${startDate} → ${endDate}...`);
  const conn = await reportingDB.getConnection();

  try {
    await conn.beginTransaction();

    const dates = getDateRange(startDate, endDate);
    console.log(`📆 Processing ${dates.length} days from ${dates[0]} to ${dates[dates.length - 1]}...`);

    const BATCH_SIZE = 100; // 🚀 Tune for your API speed & DB performance
    let batch = [];

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const row = await fetchMetricForDate("candidatesNotContacted30Days", date);
      if (row) batch.push(row);

      // Insert every 100 rows or at the end
      if (batch.length >= BATCH_SIZE || i === dates.length - 1) {
        await insertMetricsBatch(conn, batch);
        console.log(`✅ Inserted ${batch.length} rows (up to ${date})`);
        batch = [];
      }
    }

    await conn.commit();
    console.log(`🎉 ETL completed successfully for ${startDate} → ${endDate}`);
  } catch (err) {
    await conn.rollback();
    console.error(`❌ ETL failed for ${startDate} → ${endDate}:`, err);
  } finally {
    conn.release();
  }
}
