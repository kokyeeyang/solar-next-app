// server/etl/utils/dbUtils.js
export async function batchInsertFacts(conn, rows, BATCH_SIZE) {
  if (!rows || rows.length === 0) {
    console.log("⚠️ No rows to insert");
    return;
  }

  const chunks = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    chunks.push(rows.slice(i, i + BATCH_SIZE));
  }

  for (const chunk of chunks) {
    // ✅ Convert objects into arrays (only the columns we actually have!)
    const values = chunk.map(r => [
      r.metric_name,
      r.metric_date,
      r.metric_value,
      r.target_value,
      r.currency || "MYR",
    ]);

    await conn.query(
      `
      INSERT INTO daily_metrics (
        metric_name,
        metric_date,
        metric_value,
        target_value,
        currency
      )
      VALUES ?
      ON DUPLICATE KEY UPDATE
        metric_value = VALUES(metric_value),
        target_value = VALUES(target_value)
      `,
      [values]
    );
  }

  console.log(`✅ Inserted ${rows.length} rows into daily_metrics`);
}
