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
import { processCombination, processInBatches } from "../utils/apiUtils.js";
import { batchInsertFacts } from "../utils/dbUtils.js";

function getDateRange(start, end) {
  const dates = [];
  let current = new Date(start);
  while (current <= new Date(end)) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function runCandidateCallsETL() {
  const conn = await reportingDB.getConnection();
  console.log("📊 Running ETL for candidatecalls...");

  try {
    await conn.beginTransaction();
    const dates = getDateRange(START_DATE, END_DATE);
    const tasks = [];

    for (const date of dates) {
      for (const region of REGIONS) {
        for (const office of OFFICES) {
          for (const func of FUNCTIONS) {
            for (const dealboard of DEALBOARDS) {
              for (const sector of SECTORS) {
                for (const rev of REVENUE_STREAMS) {
                  for (const consultant of CONSULTANTS) {
                    tasks.push((conn) =>
                      processCombination(conn, "candidatecalls", date, region, office, func, dealboard, sector, rev, consultant)
                    );
                  }
                }
              }
            }
          }
        }
      }
    }

    const rows = await processInBatches(tasks, MAX_CONCURRENCY, conn);
    await batchInsertFacts(conn, rows, BATCH_SIZE);

    await conn.commit();
    console.log("✅ candidatecalls ETL complete.");
  } catch (err) {
    await conn.rollback();
    console.error("❌ ETL failed:", err);
  } finally {
    conn.release();
  }
}
