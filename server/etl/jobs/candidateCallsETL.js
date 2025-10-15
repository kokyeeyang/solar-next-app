// server/etl/jobs/candidateCallsETL.js
import { reportingDB } from "../../db/connection.js";
import {
  START_DATE,
  END_DATE,
  REGIONS,
  OFFICES,
  FUNCTIONS,
  DEALBOARDS,
  SECTORS,
  REVENUE_STREAMS,
  CONSULTANTS,
  MAX_CONCURRENCY,
  BATCH_SIZE,
} from "../ETLConfig.js";
import { processInBatches } from "../utils/apiUtils.js";
import { batchInsertFacts } from "../utils/dbUtils.js";
import fetch from "node-fetch";

// 🧠 Generate a date range array
function getDateRange(start, end) {
  const dates = [];
  let current = new Date(start);
  while (current <= new Date(end)) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * 📡 Dynamically call the API with only real filters
 */
async function processCombination(
  conn,
  metric,
  date,
  region,
  office,
  func,
  dealboard,
  sector,
  revenueStream,
  consultant
) {
  // If literally *all* filters are empty, skip this combination
  if (
    !region &&
    !office &&
    !dealboard &&
    !func &&
    !sector &&
    !revenueStream &&
    !consultant
  ) {
    return null;
  }

  const params = new URLSearchParams();
  params.append("metric", metric);
  params.append("datefrom", date);
  params.append("dateto", date);
  params.append("currency", "MYR");
  params.append("output", "total");

  if (region) params.append("region", region);
  if (office) params.append("office", office);
  if (func) params.append("function", func);
  if (dealboard) params.append("dealboard", dealboard);
  if (sector) params.append("sector", sector);
  if (revenueStream) params.append("revenuestream", revenueStream);
  if (consultant) params.append("consultant", consultant);

  const url = `https://so-api.azurewebsites.net/ingress/ajax/api?${params.toString()}`;

  try {
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      console.error(`❌ API error ${res.status} for ${url}`);
      console.error("Response:", text.slice(0, 200));
      return null;
    }

    const data = JSON.parse(text);

    return {
      metric_name: metric,
      metric_date: date,
      region: region || "",
      office: office || "",
      function: func || "",
      consultant: consultant || "",
      dealboard: dealboard || "",
      sector: sector || "",
      revenue_stream: revenueStream || "",
      metric_value: data.total || 0,
      target_value: data.target || null,
      currency: "MYR",
      created_at: new Date(),
    };
  } catch (err) {
    console.error(`❌ Failed for ${url}:`, err.message);
    return null;
  }
}

/**
 * 🛠️ Main ETL function for candidatecalls
 */
export async function runCandidateCallsETL() {
  const conn = await reportingDB.getConnection();
  console.log("📊 Running ETL for candidatecalls...");

  try {
    await conn.beginTransaction();
    const dates = getDateRange(START_DATE, END_DATE);
    const tasks = [];

    // ✅ Build task list dynamically
    for (const date of dates) {
      for (const region of [...REGIONS, ""]) {
        for (const office of [...OFFICES, ""]) {
          for (const func of [...FUNCTIONS, ""]) {
            for (const dealboard of [...DEALBOARDS, ""]) {
              for (const sector of [...SECTORS, ""]) {
                for (const rev of [...REVENUE_STREAMS, ""]) {
                  for (const consultant of [...CONSULTANTS, ""]) {
                    tasks.push((conn) =>
                      processCombination(
                        conn,
                        "candidatecalls",
                        date,
                        region,
                        office,
                        func,
                        dealboard,
                        sector,
                        rev,
                        consultant
                      )
                    );
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log(`📦 Total tasks prepared: ${tasks.length}`);

    // ✅ Process in batches with concurrency
    const rows = await processInBatches(tasks, MAX_CONCURRENCY, conn);
    console.log(`✅ Total rows to insert: ${rows.length}`);

    // ✅ Bulk insert into DB
    await batchInsertFacts(conn, rows, BATCH_SIZE);

    await conn.commit();
    console.log("🎉 candidatecalls ETL completed successfully.");
  } catch (err) {
    await conn.rollback();
    console.error("❌ ETL failed:", err);
  } finally {
    conn.release();
  }
}
