// server/etl/runAllETL.js
// import { runCandidateCallsETL } from "./jobs/candidateCallsEtl.js";
import { runCandidateCallsETL } from "./jobs/candidateCallsETL.js";
// import { runCvsSentETL } from "./jobs/cvssentETL.js";
// import { runInterviewsETL } from "./jobs/interviewsETL.js";
(async () => {
  console.log("🚀 Starting all ETL jobs...");
  await runCandidateCallsETL();
  // await runCvsSentETL();
  // await runInterviewsETL();
  console.log("✅ All ETL jobs finished!");
})();
