// server/etl/jobs/candidatesNotContactedRowsETL.js
import fetch from "node-fetch";
import { reportingDB } from "../../db/connection.js";

/**
 * 📡 Fetch all "candidatesNotContacted30Days" rows from API
 */
async function fetchCandidateRows() {
  const url = `https://so-api.azurewebsites.net/ingress/ajax/api?metric=candidatesNotContacted30Days&currency=MYR&output=rows`;

  console.log("📡 Fetching candidatesNotContacted30Days rows...");

  const res = await fetch(url);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${text.slice(0, 200)}`);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Failed to parse JSON response: " + err.message);
  }
}

/**
 * 🗄️ Insert rows into MySQL
 */
async function insertCandidateRows(conn, rows) {
  if (!rows || rows.length === 0) {
    console.log("⚠️ No rows returned from API.");
    return;
  }

  const snapshotDate = new Date().toISOString().split("T")[0];

  const values = rows.map(r => [
    r.PlacementID || null,
    r.lastCalled || null,
    r.StartDate || null,
    r.EndDate || null,
    r.OwnerName || null,
    r.CandidateID || null,
    r.Candidate || null,
    r.Region || null,
    r.Office || null,
    r.Team || null,
    r.Dealboard || null,
    r.SOSector || null,
    r.JobID || null,
    r.JobTitle || null,
    snapshotDate
  ]);

  await conn.query(
    `
    INSERT INTO candidates_not_contacted_rows (
      placement_id, last_called, start_date, end_date, owner_name,
      candidate_id, candidate_name, region, office, team,
      dealboard, so_sector, job_id, job_title, snapshot_date
    ) VALUES ?
    ON DUPLICATE KEY UPDATE
      last_called = VALUES(last_called),
      end_date = VALUES(end_date),
      owner_name = VALUES(owner_name),
      team = VALUES(team),
      dealboard = VALUES(dealboard),
      so_sector = VALUES(so_sector),
      job_title = VALUES(job_title)
    `,
    [values]
  );

  console.log(`✅ Inserted or updated ${values.length} rows into candidates_not_contacted_rows.`);
}

/**
 * 🚀 Run ETL job
 */
export async function runCandidatesNotContactedRowsETL() {
  console.log("📊 Starting ETL for candidatesNotContacted30Days rows...");
  const conn = await reportingDB.getConnection();

  try {
    await conn.beginTransaction();

    const rows = await fetchCandidateRows();
    await insertCandidateRows(conn, rows);

    await conn.commit();
    console.log("🎉 candidatesNotContacted30Days rows ETL completed successfully!");
  } catch (err) {
    await conn.rollback();
    console.error("❌ ETL failed:", err);
  } finally {
    conn.release();
  }
}
