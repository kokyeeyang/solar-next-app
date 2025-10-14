// server/etl/dailyMetricsByRegionOffice.js
import fetch from "node-fetch";
import { reportingDB } from "../db/connection.js";

const METRIC = "candidatecalls";
const START_DATE = "2025-01-01";
const END_DATE = "2025-10-14";

const REGIONS = ["EMEA", "APAC", "Americas"];
const OFFICES = ["London", "Singapore", "New York", "Kuala Lumpur"];
const FUNCTIONS = ["Contract", "Permanent"];
const DEALBOARDS = [
  "Accounts Assembled (LON)",
  "Atomic Written (LON)",
  "Big Fees Big PVs",
  "Billy Big Timers (GLA)",
  "Brogram",
  "Downstream Cowboys",
  "Earth, Wind & Hire (LON)",
  "Eurovision (DUS)",
];

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
  const rowsToInsert = [];

  console.log(`📊 Starting ETL for ${METRIC} from ${START_DATE} to ${END_DATE}...`);

  for (const date of dates) {
    for (const region of REGIONS) {
      for (const office of OFFICES) {
        const url = `https://so-api.azurewebsites.net/ingress/ajax/api?metric=${METRIC}&datefrom=${date}&dateto=${date}&currency=MYR&region=${region}&office=${office}&function=${FUNCTIONS}&dealboard=${DEALBOARDS}&output=total`;

        console.log(`📡 Fetching ${METRIC} for ${region} - ${office} on ${date}`);
        const res = await fetch(url);
        const data = await res.json();

        rowsToInsert.push({
          metric_name: METRIC,
          metric_date: date,
          region,
          office,
          metric_value: data.total || 0,
          target_value: data.target || null,
          currency: "MYR",
          function: "", // optional fields – adjust if you have values
          consultant: "",
          dealboard: "",
          revenue_stream: "",
          sector: "",
          team: "",
        });
      }
    }
  }

  console.log(`📦 Fetched ${rowsToInsert.length} rows — inserting into DB...`);

  // ✅ 1. Build bulk insert SQL
  const values = rowsToInsert
    .map(
      (r) =>
        `('${r.metric_name}', '${r.metric_date}', '${r.region}', '${r.office}', ${
          r.metric_value
        }, ${r.target_value ?? "NULL"}, '${r.currency}', '${r.function}', '${r.consultant}', '${r.dealboard}', '${r.revenue_stream}', '${r.sector}', '${r.team}')`
    )
    .join(",");

  const sql = `
    INSERT INTO daily_metrics 
      (metric_name, metric_date, region, office, metric_value, target_value, currency, function, consultant, dealboard, revenue_stream, sector, team)
    VALUES ${values}
    ON DUPLICATE KEY UPDATE 
      metric_value = VALUES(metric_value),
      target_value = VALUES(target_value)
  `;

  // ✅ 2. Execute as a single transaction
  const conn = await reportingDB.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(sql);
    await conn.commit();
    console.log("✅ Bulk insert complete!");
  } catch (err) {
    await conn.rollback();
    console.error("❌ ETL insert failed:", err);
    process.exit(1);
  } finally {
    conn.release();
  }

  console.log("🎉 ETL complete!");
  process.exit(0);
}

runETL().catch((err) => {
  console.error("❌ ETL failed:", err);
  process.exit(1);
});
