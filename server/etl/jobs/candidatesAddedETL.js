// server/etl/jobs/candidatesAddedETL.js
import fetch from "node-fetch";
import { publishMetricEvent } from "../../kafka/producers/metricProducer.js";

/**
 * 📆 Generate a date range array (inclusive)
 */
function getDateRange(startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(endDate) : new Date();
  const dates = [];

  let current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * 📡 Fetch metric for a single date
 */
async function fetchMetricForDate(metric, date) {
  const url = `https://so-api.azurewebsites.net/ingress/ajax/api?metric=${metric}&datefrom=${date}&dateto=${date}&currency=MYR&output=total`;

  try {
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      console.error(`❌ API error ${res.status} for ${metric} on ${date}`);
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
 * 🚀 Kafka-only ETL for candidatesadded metric
 */
export async function runCandidatesAddedETL(startDate, endDate) {
  console.log(`📊 Starting candidatesadded ETL job${startDate && endDate ? ` for ${startDate} → ${endDate}` : ""}...`);

  try {
    const dates = getDateRange(startDate, endDate);
    console.log(`📆 Processing ${dates.length} days from ${dates[0]} to ${dates[dates.length - 1]}...`);

    for (const date of dates) {
      const row = await fetchMetricForDate("candidatesadded", date);
      if (!row) continue; // important safety check

      await publishMetricEvent(row);
      console.log(`📤 Published Kafka event → ${row.metric_name} @ ${row.metric_date}`);
    }

    console.log("🎉 candidatesadded ETL completed successfully!");
  } catch (err) {
    console.error("❌ ETL failed:", err);
  }
}
