// server/etl/runAllHistoricalETL.js
import { runCandidateCallsETL } from "./jobs/candidateCallsETL.js";

/** Format a Date as YYYY-MM-DD in local time (avoids UTC off-by-one) */
function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Split Jan 1 → today into monthly or quarterly ranges (inclusive)
 * @param {"monthly"|"quarterly"} interval
 */
function getDynamicDateRanges(interval = "quarterly") {
  const ranges = [];
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const today = new Date();

  let currentStart = new Date(startOfYear);

  while (currentStart <= today) {
    let currentEnd = new Date(currentStart);

    if (interval === "monthly") {
      currentEnd.setMonth(currentEnd.getMonth() + 1);
      currentEnd.setDate(0);                 // last day of that month
    } else if (interval === "quarterly") {
      currentEnd.setMonth(currentEnd.getMonth() + 3);
      currentEnd.setDate(0);                 // last day of that quarter
    } else {
      throw new Error(`Unknown interval: ${interval}`);
    }

    if (currentEnd > today) currentEnd = today; // clamp

    ranges.push({
      start: toLocalISODate(currentStart),
      end: toLocalISODate(currentEnd),
    });

    // move to next day after currentEnd
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }

  return ranges;
}

async function runBackfillETL() {
  const INTERVAL = process.env.ETL_INTERVAL || "monthly"; // "monthly" or "quarterly"
  console.log(`📜 Historical backfill for candidatecalls (${INTERVAL})`);

  const ranges = getDynamicDateRanges(INTERVAL);
  console.log("📆 Ranges:", ranges);

  for (const { start, end } of ranges) {
    console.log(`🚀 Running candidatecalls ETL for ${start} → ${end}`);
    await runCandidateCallsETL(start, end); // <-- ensure your ETL supports (start, end)
  }

  console.log("✅ Historical backfill complete.");
}

runBackfillETL().catch((err) => {
  console.error("❌ Backfill ETL failed:", err);
  process.exit(1);
});
