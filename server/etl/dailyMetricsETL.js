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

// 🧠 Utility: generate array of all dates in a range
function getDateRange(start, end) {
  const dates = [];
  let current = new Date(start);
  while (current <= new Date(end)) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

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

  const dates = getDateRange(START_DATE, END_DATE);
  const rowsToInsert = [];

  // ✅ 1. Fetch data from API with validation
  for (const date of dates) {
    for (const region of REGIONS) {
      for (const office of OFFICES) {
        const url = `https://so-api.azurewebsites.net/ingress/ajax/api?metric=${METRIC}&datefrom=${date}&dateto=${date}&currency=MYR&region=${region}&office=${office}&function=${FUNCTIONS}&dealboard=${DEALBOARDS}&output=total`;

        console.log(`📡 Fetching ${METRIC} for ${region} - ${office} on ${date}`);

        const res = await fetch(url);
        const text = await res.text();

        if (!res.ok) {
          console.error(`❌ API error ${res.status} for ${region}/${office} on ${date}`);
          console.error("Response:", text.slice(0, 200));
          continue;
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error(`❌ Invalid JSON for ${region}/${office} on ${date}`);
          console.error("Response preview:", text.slice(0, 200));
          continue;
        }

        rowsToInsert.push({
          metric_name: METRIC,
          metric_date: date,
          region,
          office,
          metric_value: data.total || 0,
          target_value: data.target || null,
          currency: "MYR",
          function: "",
          consultant: "",
          dealboard: "",
          revenue_stream: "",
          sector: "",
          team: "",
        });
      }
    }
  }

  console.log(`📦 Total rows prepared for insert: ${rowsToInsert.length}`);

  // ✅ 2. Bulk insert into DB in chunks with transaction & progress tracking
  const connection = await reportingDB.getConnection();
  const chunkSize = 500;
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
