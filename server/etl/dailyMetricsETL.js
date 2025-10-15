import fetch from "node-fetch";
import { reportingDB } from "../db/connection.js";

/**
 * 🧠 Utility: Chunk an array into smaller arrays
 */
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * 🛠️ Main ETL function
 * - 1️⃣ Fetch data from external API
 * - 2️⃣ Transform into DB-ready format
 * - 3️⃣ Bulk insert in chunks with progress logging
 */
export async function runETL() {
  console.time("⏱️ ETL duration");

  console.log("🌐 Fetching data from API...");
  const response = await fetch("https://your-api-endpoint.com/metrics");
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);

  const rawData = await response.json();
  console.log(`📦 Fetched ${rawData.length} rows — preparing for insert...`);

  // ✅ Transform raw data into correct DB shape
  const rows = rawData.map(item => ({
    metric_name: item.metric_name,
    metric_date: item.metric_date,
    region: item.region || null,
    office: item.office || null,
    metric_value: item.metric_value || 0,
    target_value: item.target_value || null,
    currency: item.currency || "MYR",
  }));

  const connection = await reportingDB.getConnection();
  const chunkSize = 500;
  const chunks = chunkArray(rows, chunkSize);
  const total = rows.length;

  try {
    await connection.beginTransaction();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Prepare bulk VALUES for the insert
      const values = chunk.map(row => [
        row.metric_name,
        row.metric_date,
        row.region,
        row.office,
        row.metric_value,
        row.target_value,
        row.currency,
      ]);

      await connection.query(
        `
        INSERT INTO daily_metrics 
          (metric_name, metric_date, region, office, metric_value, target_value, currency)
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
    console.error("❌ ETL failed:", err);
  } finally {
    connection.release();
    console.timeEnd("⏱️ ETL duration");
  }
}

// Allow standalone execution: `node server/etl/dailyMetricsETL.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  runETL().catch(err => {
    console.error("❌ ETL failed:", err);
    process.exit(1);
  });
}
