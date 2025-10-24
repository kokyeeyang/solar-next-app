// server/etl/runAllETL.js
import { reportingDB } from "../db/connection.js";
import { runCandidateCallsETL } from "./jobs/candidateCallsETL.js";
import { runCandidatesAddedETL } from "./jobs/candidatesAddedETL.js";
import { runJobsAddedETL } from "./jobs/jobsAddedETL.js";
import { runCandidatesNotContacted30DaysETL } from "./jobs/candidatesNotContacted30DaysETL.js";
import { runCandidatesNotContactedRowsETL } from "./jobs/candidatesNotContacted30DaysRowsETL.js";

// 🧩 Helper: format today's date as YYYY-MM-DD
function todayISO() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

(async () => {
  const today = todayISO();
  console.log(`🚀 Starting daily ETL for ${today}`);

  try {
    console.log(`📞 Running Candidate Calls ETL for ${today}`);
    await runCandidateCallsETL(today, today);

    console.log(`👥 Running Candidates Added ETL for ${today}`);
    await runCandidatesAddedETL(today, today);

    console.log(`👥 Running Jobs Added ETL for ${today}`);
    await runJobsAddedETL(today, today);

    console.log(`⏳ Running Candidates Not Contacted (30 Days) for ${today}`);
    await runCandidatesNotContacted30DaysETL(today, today);

    console.log(`📋 Running Candidates Not Contacted (Rows) for ${today}`);
    await runCandidatesNotContactedRowsETL(today, today);

    console.log("✅ All daily ETL jobs completed successfully!");
  } catch (err) {
    console.error("❌ Daily ETL failed:", err);
    process.exitCode = 1;
  } finally {
    // Gracefully close MySQL connection pool
    if (reportingDB && typeof reportingDB.end === "function") {
      await reportingDB.end();
      console.log("🔌 MySQL pool closed.");
    }
    process.exit();
  }
})();
