// server/etl/runAllETL.js
// import { runCandidateCallsETL } from "./jobs/candidateCallsEtl.js";
import { runCandidateCallsETL } from "./jobs/candidateCallsETL.js";
import { runCandidatesAddedETL } from "./jobs/candidatesAddedETL.js";
import { runCandidatesNotContacted30DaysETL } from "./jobs/candidatesNotContacted30DaysETL.js";
import { runCandidatesNotContactedRowsETL } from "./jobs/candidatesNotContacted30DaysRowsETL.js";
// import { runCvsSentETL } from "./jobs/cvssentETL.js";
// import { runInterviewsETL } from "./jobs/interviewsETL.js";
(async () => {
  console.log("🚀 Starting all ETL jobs...");
  await runCandidateCallsETL();
  await runCandidatesNotContacted30DaysETL();
  await runCandidatesNotContactedRowsETL();
  await runCandidatesAddedETL();

  console.log("✅ All ETL jobs finished!");
})();
