// server/etl/jobs/candidatesNotContacted30DaysETL.js
import fetch from "node-fetch";
import { publishMetricEvent } from "../../kafka/producers/metricProducer.js";

export async function runCandidatesNotContacted30DaysETL() {
  console.log("📊 Starting ETL for candidatesNotContacted30Days (single total)...");

  try {
    const url = `https://so-api.azurewebsites.net/ingress/ajax/api?metric=candidatesNotContacted30Days&currency=MYR&output=total`;

    console.log(`📡 Fetching data from: ${url}`);
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = JSON.parse(text);

    // Kafka event format
    const metricRow = {
      metric_name: "candidatesNotContacted30Days",
      metric_date: new Date().toISOString().split("T")[0], // today’s date
      metric_value: data.total || 0,
      target_value: data.target || null,
      currency: "MYR",
    };

    await publishMetricEvent(metricRow);

    console.log("📤 Published Kafka event → candidatesNotContacted30Days");
    console.log("🎉 ETL for candidatesNotContacted30Days completed successfully.");
  } catch (err) {
    console.error("❌ ETL failed:", err);
  }
}
