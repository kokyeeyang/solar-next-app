// server/etl/dailyMetricsByRegionOffice.js
import fetch from "node-fetch";
import { reportingDB } from "../db/connection.js";

const METRIC = "candidatecalls";
const START_DATE = "2025-01-01";
const END_DATE = "2025-10-14";

const REGIONS = ["EMEA", "APAC", "Americas"];
const OFFICES = ["London", "Singapore", "New York", "Kuala Lumpur"];
const FUNCTION = ["Contract", "Permanent"];
const DEALBOARD = ["Accounts Assembled (LON)", "Atomic Written (LON)", "Big Fees Big PVs", "Billy Big Timers (GLA)", "Brogram", "Downstream Cowboys", "Earth, Wind & Hire (LON)", "Eurovision (DUS)"];

function getDateRange(start, end) {
  const dates = [];
  let current = new Date(start);
  while (current <= new Date(end)) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

async function runETL() {
  const dates = getDateRange(START_DATE, END_DATE);

  for (const date of dates) {
    for (const region of REGIONS) {
      for (const office of OFFICES) {
        const url = `https://so-api.azurewebsites.net/ingress/ajax/api?metric=${METRIC}&datefrom=${date}&dateto=${date}&currency=MYR&region=${region}&office=${office}&function=${FUNCTION}&dealboard=${DEALBOARD}&output=total`;

        console.log(`📡 Fetching ${METRIC} for ${region} - ${office} on ${date}`);
        const res = await fetch(url);
        const data = await res.json();

        const total = data.total || 0;
        const target = data.target || null;

        await reportingDB.query(
          `
          INSERT INTO daily_metrics 
            (metric_name, metric_date, region, office, metric_value, target_value, currency)
          VALUES (?, ?, ?, ?, ?, ?, 'MYR')
          ON DUPLICATE KEY UPDATE 
            metric_value = VALUES(metric_value),
            target_value = VALUES(target_value)
          `,
          [METRIC, date, region, office, total, target]
        );

        console.log(`✅ Stored: ${region}-${office} ${total}`);
      }
    }
  }

  console.log("🎉 ETL complete!");
  process.exit(0);
}

runETL().catch(err => {
  console.error("❌ ETL failed:", err);
  process.exit(1);
});
