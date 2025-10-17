// server/etl/jobs/candidatesNotContactedRowsETL.js
import fetch from "node-fetch";
import { reportingDB } from "../../db/connection.js";

/**
 * 📡 Fetch all rows for candidatesNotContacted30Days
 */
async function fetchCandidatesNotContactedRows() {
  const url = `https://so-api.azurewebsites.net/ingress/ajax/api?metric=candidatesNotContacted30Days&currency=MYR&output=rows`;
  console.log("📡 Fetching rows from:", url);

  try {
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      console.error(`❌ API error ${res.status}`);
      console.error("Response:", text.slice(0, 300));
      return [];
    }

    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      console.error("❌ Unexpected API response format:", data);
      return [];
    }

    console.log(`✅ Retrieved ${data.length} rows from API.`);
    return data;
  } catch (err) {
    console.error("❌ Failed to fetch data:", err.message);
    return [];
  }
}

/**
 * 🗄️ Insert rows into MySQL (batch insert with upsert)
 */
async function insertRowsIntoDB(conn, rows) {
  if (rows.length === 0) {
    console.log("⚠️ No rows to insert.");
    return;
  }

  const values = rows.map(r => [
    r.PlacementID || null,
    r.lastCalled ? new Date(r.lastCalled) : null,
    r.StartDate ? new Date(r.StartDate) : null,
    r.EndDate ? new Date(r.EndDate) : null,
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
  ]);

  await conn.query(
    `
    INSERT INTO candidates_not_contacted_rows (
      placement_id, last_called, start_date, end_date, owner_name,
      candidate_id, candidate_name, region, office, team,
      dealboard, so_sector, job_id, job_title
    )
    VALUES ?
    ON DUPLICATE KEY UPDATE
      last_called = VALUES(last_called),
      start_date = VALUES(start_date),
      end_date = VALUES(end_date),
      owner_name = VALUES(owner_name),
      candidate_id = VALUES(candidate_id),
      candidate_name = VALUES(candidate_name),
      region = VALUES(region),
      office = VALUES(office),
      team = VALUES(team),
      dealboard = VALUES(dealboard),
      so_sector = VALUES(so_sector),
      job_id = VALUES(job_id),
      job_title = VALUES(job_title)
    `,
    [values]
  );

  console.log(`✅ Inserted or updated ${rows.length} rows into candidates_not_contacted_rows`);
}

/**
 * 🚀 Main ETL job
 */
export async function runCandidatesNotContactedRowsETL() {
  console.log("📊 Starting ETL for candidatesNotContacted30Days (rows)...");

  const conn = await reportingDB.getConnection();
  try {
    await conn.beginTransaction();

    const rows = await fetchCandidatesNotContactedRows();
    await insertRowsIntoDB(conn, rows);

    await conn.commit();
    console.log("🎉 ETL completed successfully!");
  } catch (err) {
    await conn.rollback();
    console.error("❌ ETL failed:", err);
  } finally {
    conn.release();
  }
}

// Allow running standalone (for manual runs)
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runCandidatesNotContactedRowsETL().then(() => process.exit(0));
}
