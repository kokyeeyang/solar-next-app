// server/etl/jobs/candidatesNotContacted30DaysETL.js
import fetch from "node-fetch";
import { reportingDB } from "../../db/connection.js";

export async function runCandidatesNotContacted30DaysETL() {
  console.log("📊 Starting ETL for candidatesNotContacted30Days (single total)...");

  const conn = await reportingDB.getConnection();

  try {
    await conn.beginTransaction();

    const url = `https://so-api.azurewebsites.net/ingress/ajax/api?metric=candidatesNotContacted30Days&currency=MYR&output=total`;

    console.log(`📡 Fetching data from: ${url}`);
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = JSON.parse(text);

    const metricRow = {
      metric_name: "candidatesNotContacted30Days",
      metric_date: new Date().toISOString().split("T")[0], // today's date (or static if you prefer)
      metric_value: data.total || 0,
      target_value: data.target || null,
      currency: "MYR",
    };

    // ✅ Insert or update the single row
    await conn.query(
      `
      INSERT INTO daily_metrics (
        metric_name,
        metric_date,
        metric_value,
        target_value,
        currency
      )
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        metric_value = VALUES(metric_value),
        target_value = VALUES(target_value)
      `,
      [
        metricRow.metric_name,
        metricRow.metric_date,
        metricRow.metric_value,
        metricRow.target_value,
        metricRow.currency,
      ]
    );

    await conn.commit();
    console.log("🎉 ETL for candidatesNotContacted30Days completed successfully.");
  } catch (err) {
    await conn.rollback();
    console.error("❌ ETL failed:", err);
  } finally {
    conn.release();
  }
}
