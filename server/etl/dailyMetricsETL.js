// server/etl/dailyMetricsETL.js
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

/* ───────── helpers ───────── */
function getDateRange(start, end) {
  const dates = [];
  let cur = new Date(start);
  const endDate = new Date(end);
  while (cur <= endDate) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

/* ───────── API fetch helper ───────── */
async function fetchMetricForCombo(date, region, office, dealboard) {
  const url =
    `https://so-api.azurewebsites.net/ingress/ajax/api?metric=${METRIC}` +
    `&datefrom=${date}` +
    `&dateto=${date}` +
    `&currency=MYR` +
    `&region=${encodeURIComponent(region)}` +
    `&office=${encodeURIComponent(office)}` +
    `&function=${encodeURIComponent(FUNCTIONS.join(","))}` +
    `&dealboard=${encodeURIComponent(dealboard)}` +
    `&output=total`;

  try {
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      console.error(`❌ API error ${res.status} for ${region}/${office}/${dealboard} on ${date}`);
      console.error("Response:", text.slice(0, 200));
      return null;
    }

    const data = JSON.parse(text);

    return {
      metric_name: METRIC,
      metric_date: date,
      region,
      office,
      metric_value: data.total || 0,
      target_value: data.target || null,
      currency: "MYR",
      function: FUNCTIONS.join(","),
      consultant: "",
      dealboard, // ✅ single dealboard now
      revenue_stream: "",
      sector: "",
      team: "",
    };
  } catch (err) {
    console.error(`❌ Failed for ${region}/${office}/${dealboard} on ${date}:`, err.message);
    return null;
  }
}

/* ───────── main ───────── */
async function runETL() {
  console.time("⏱️ ETL total");
  console.log(`📊 Parallel ETL for ${METRIC} from ${START_DATE} to ${END_DATE}...`);

  const dates = getDateRange(START_DATE, END_DATE);
  const allTasks = [];

  // ✅ Build all API tasks: date × region × office × dealboard
  for (const date of dates) {
    for (const region of REGIONS) {
      for (const office of OFFICES) {
        for (const dealboard of DEALBOARDS) {
          allTasks.push({ date, region, office, dealboard });
        }
      }
    }
  }

  console.log(`📡 Total API calls to make: ${allTasks.length}`);

  const BATCH_SIZE = 20; // adjust depending on API limits
  const rowsToInsert = [];

  // ✅ Process API calls in parallel batches
  const taskChunks = chunkArray(allTasks, BATCH_SIZE);
  let processed = 0;

  for (const chunk of taskChunks) {
    const results = await Promise.all(
      chunk.map(({ date, region, office, dealboard }) =>
        fetchMetricForCombo(date, region, office, dealboard)
      )
    );

    rowsToInsert.push(...results.filter(Boolean));
    processed += chunk.length;
    console.log(`✅ Processed ${processed}/${allTasks.length} API calls`);
  }

  console.log(`📦 Prepared ${rowsToInsert.length} rows for insert.`);

  // ✅ 2. Bulk insert into MySQL (transaction + chunks)
  const connection = await reportingDB.getConnection();
  const INSERT_CHUNK_SIZE = 1000;
  const insertChunks = chunkArray(rowsToInsert, INSERT_CHUNK_SIZE);
  const total = rowsToInsert.length;

  try {
    await connection.beginTransaction();
    console.log("🗄️ Inserting into MySQL...");

    for (let i = 0; i < insertChunks.length; i++) {
      const chunk = insertChunks[i];
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
          (metric_name, metric_date, region, office, metric_value, target_value, currency, \`function\`, consultant, dealboard, revenue_stream, sector, team)
        VALUES ?
        ON DUPLICATE KEY UPDATE 
          metric_value = VALUES(metric_value),
          target_value = VALUES(target_value)
        `,
        [values]
      );

      const inserted = Math.min((i + 1) * INSERT_CHUNK_SIZE, total);
      console.log(`✅ Inserted ${inserted}/${total} rows (${((inserted / total) * 100).toFixed(2)}%)`);
    }

    await connection.commit();
    console.log("🎉 ETL completed successfully!");
  } catch (err) {
    await connection.rollback();
    console.error("❌ ETL insert failed:", err);
    process.exit(1);
  } finally {
    connection.release();
    console.timeEnd("⏱️ ETL total");
  }

  process.exit(0);
}

runETL().catch((err) => {
  console.error("❌ ETL failed:", err);
  process.exit(1);
});
