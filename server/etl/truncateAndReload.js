// server/etl/truncateAndReload.js
import readline from "readline";
import { reportingDB } from "../db/connection.js";
import { runCandidateCallsETL } from "./jobs/candidateCallsETL.js";

// 🧠 Ask for confirmation before truncating
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}

async function truncateAndReload() {
  const answer = await askConfirmation(
    "⚠️ This will DELETE ALL rows in `daily_metrics`. Are you sure? (yes/no): "
  );

  if (answer !== "yes") {
    console.log("❌ Aborted. No changes were made.");
    process.exit(0);
  }

  const conn = await reportingDB.getConnection();
  try {
    console.log("🗑️ Truncating `daily_metrics` table...");
    await conn.query("TRUNCATE TABLE daily_metrics;");
    console.log("✅ Table truncated successfully.");

    console.log("🚀 Starting ETL reload...");
    await runCandidateCallsETL();
  } catch (err) {
    console.error("❌ Failed during truncate or reload:", err);
  } finally {
    conn.release();
  }
}

// 🔥 Run the script
truncateAndReload();
