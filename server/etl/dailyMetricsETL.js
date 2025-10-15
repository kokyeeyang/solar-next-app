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

// 🧠 Utility: chunk array into groups of size N
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function runETL() {
  console.time("⏱️ ETL total duration");
  console.log(`📊 Starting ETL for ${METRIC} from ${START_DATE} to ${END_DATE}...`);

  // ✅ 1. Build one API call with all regions, offices, and full date range
  const regionParam = REGIONS.join(",");
  const officeParam = OFFICES.join(",");
  const functionParam = FUNCTIONS.join(",");
  const dealboardParam = DEALBOARDS.join(",");

  const url = `https://so-api.azurewebsites.net/ingress/ajax/api?metric=${METRIC}&datefrom=${START_DATE}&dateto=${END_DATE}&currency=MYR&region=${regionParam}&office=${officeParam}&function=${functionParam}&dealboard=${dealboardParam}&output=total`;

  console.log(`📡 Fetching all ${METRIC} data from API in one go...`);
  const res = await fetch(url);
  const text = await res.text();

  if (!res.ok) {
    console.error(`❌ API request failed with ${res.status}`);
    console.error("Response:", text.slice(0, 500));
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error("❌ Invalid JSON from API");
    console.error("Response preview:", text.slice(0, 500));
    process.exit(1);
  }

  // ✅ 2. Transform API response into rows for DB
  if (!Array.isArray(data)) {
    console.error("❌ Unexpected API response format. Expected an array.");
    process.exit(1);
  }

  const rowsToInsert = data.map((item) => ({
    metric_name: METRIC,
    metric_date: item.metric_date || item.Date || START_DATE,
    region: item.region || item.Region || "",
    office: item.office || item.Office || "",
    metric_value: item.total || 0,
    target_value: item.target || null,
    currency: "MYR",
    function: item.function || "",
    consultant: item.consultant || "",
    dealboard: item.dealboard || "",
    revenue_stream: item.revenue_stream || "",
    sector: item.sector || "",
    team: item.team || "",
  }));

  console.log(`📦 Total rows prepared for insert: ${rowsToInsert.length}`);

  // ✅ 3. Bulk insert into DB in chunks with transaction & progress tracking
  const connection = await reportingDB.getConnection();
  const chunkSize = 1000; // Adjust based on expected volume
  const chunks = chunkArray(rowsToInsert, chunkSize);
  const total = rowsToInsert.length;

  try {
    await connection.beginTransaction();
    console.log("🗄️ Inserting data into MySQL...");

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const values = chunk.map((r) => [
        r.metric_name,
        r.metric_date,
        r.region,
        r.office,
        r.metric_value,
        r.target_value,
        r.currency,
        r.function,
        r.consultant,
        r.dealboard,
        r.revenue_stream,
        r.sector,
        r.team,
      ]);

      await connection.query(
        `
        INSERT INTO daily_metrics 
          (metric_name, metric_date, region, office, metric_value, target_value, currency, function, consultant, dealboard, revenue_stream, sector, team)
        VALUES ?
        ON DUPLICATE KEY UPDATE 
          metric_value = VALUES(metric_value),
          target_value = VALUES(target_value)
        `,
        [values]
      );

      // 📊 Progress log
      const inserted = Math.min((i + 1) * chunkSize, total);
      const percent = ((inserted / total) * 100).toFixed(2);
      console.log(`✅ Inserted ${inserted}/${total} rows (${percent}%)`);
    }

    await connection.commit();
    console.log("🎉 ETL completed successfully!");
  } catch (err) {
    await connection.rollback();
    console.error("❌ ETL insert failed:", err);
    process.exit(1);
  } finally {
    connection.release();
    console.timeEnd("⏱️ ETL total duration");
  }

  process.exit(0);
}

runETL().catch((err) => {
  console.error("❌ ETL failed:", err);
  process.exit(1);
});
