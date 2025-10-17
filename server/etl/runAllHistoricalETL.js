import { runCandidatesNotContacted30DaysETL } from "./jobs/candidatesNotContacted30DaysETL.js";

/** Format a Date as YYYY-MM-DD in local time (avoids UTC off-by-one) */
function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 📆 Split Jan 1 → today into monthly or quarterly ranges (inclusive)
 * @param {"monthly"|"quarterly"} interval
 */
function getDynamicDateRanges(interval = "quarterly") {
  const ranges = [];
  const startOfYear = new Date(new Date().getFullYear(), 0, 1); // Jan 1 (local)
  const today = new Date(); // now (local)

  let currentStart = new Date(startOfYear);

  while (currentStart <= today) {
    let currentEnd = new Date(currentStart);

    if (interval === "monthly") {
      // Move to first day of next month, then setDate(0) = last day of this month
      currentEnd.setMonth(currentEnd.getMonth() + 1);
      currentEnd.setDate(0);
    } else if (interval === "quarterly") {
      // Move to first day 3 months ahead, then setDate(0) = last day of this quarter
      currentEnd.setMonth(currentEnd.getMonth() + 3);
      currentEnd.setDate(0);
    } else {
      throw new Error(`Unknown interval: ${interval}`);
    }

    // Clamp to today if we overshoot
    if (currentEnd > today) currentEnd = today;

    const startStr = toLocalISODate(currentStart);
    const endStr = toLocalISODate(currentEnd);
    ranges.push({ start: startStr, end: endStr });

    // Advance to the next day after currentEnd
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }

  return ranges;
}

async function runBackfillETL() {
  const INTERVAL = process.env.ETL_INTERVAL || "monthly"; // "monthly" or "quarterly"
  console.log(`📊 Starting backfill ETL for candidatesNotContacted30Days… (${INTERVAL})`);

  const ranges = getDynamicDateRanges(INTERVAL);
  console.log("📆 Generated dynamic ranges:", ranges);

  for (const { start, end } of ranges) {
    console.log(`🚀 Running ETL for ${start} → ${end}`);
    await runCandidatesNotContacted30DaysETL(start, end);
  }

  console.log("🎉 All backfill ETL ranges completed successfully.");
}

runBackfillETL().catch((err) => {
  console.error("❌ Backfill ETL failed:", err);
  process.exit(1);
});
