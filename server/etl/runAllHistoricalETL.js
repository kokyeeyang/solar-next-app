// server/etl/runAllHistoricalETL.js
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { initMetricProducer } from "../kafka/producers/metricProducer.js";

import { runCandidateCallsETL } from "./jobs/candidateCallsETL.js";
import { runCandidatesAddedETL } from "./jobs/candidatesAddedETL.js";
import { runJobsAddedETL } from "./jobs/jobsAddedETL.js";
import { runCandidatesNotContacted30DaysETL } from "./jobs/candidatesNotContacted30DaysETL.js";
import { runCandidatesNotContactedRowsETL } from "./jobs/candidatesNotContacted30DaysRowsETL.js";

/** Format YYYY-MM-DD in local time */
function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Split Jan 1 → today into monthly or quarterly ranges */
function getDynamicDateRanges(interval = "quarterly") {
  const ranges = [];
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  let currentStart = new Date(startOfYear);

  while (currentStart <= today) {
    let currentEnd = new Date(currentStart);

    if (interval === "monthly") {
      currentEnd.setMonth(currentEnd.getMonth() + 1);
      currentEnd.setDate(0);
    } else {
      currentEnd.setMonth(currentEnd.getMonth() + 3);
      currentEnd.setDate(0);
    }

    if (currentEnd > today) currentEnd = today;

    ranges.push({
      start: toLocalISODate(currentStart),
      end: toLocalISODate(currentEnd),
    });

    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }

  return ranges;
}

async function runBackfillETL() {
  try {
    console.log("🚀 Initializing Kafka producer...");
    await initMetricProducer();

    const INTERVAL = process.env.ETL_INTERVAL || "monthly";
    console.log(`📜 Historical backfill interval: ${INTERVAL}`);

    const ranges = getDynamicDateRanges(INTERVAL);
    console.log("📆 Ranges:", ranges);

    for (const { start, end } of ranges) {
      console.log(`📤 Backfilling ${start} → ${end}`);

      await runCandidateCallsETL(start, end);
      await runCandidatesAddedETL(start, end);
      await runJobsAddedETL(start, end);

      // throttle between ranges to avoid API/Kafka overload
      await new Promise((res) => setTimeout(res, 500));
    }

    // one-shot metrics
    await runCandidatesNotContacted30DaysETL();
    await runCandidatesNotContactedRowsETL();

    console.log("🎉 All historical ETL jobs completed successfully.");
    process.exit(0);

  } catch (err) {
    console.error("❌ Historical ETL failed:", err);
    process.exit(1);
  }
}

runBackfillETL();
