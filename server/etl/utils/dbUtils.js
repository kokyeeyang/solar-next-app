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
    // ✅ Convert objects into arrays
    const values = chunk.map(r => [
      r.metric_date,
      r.metric_id || null,
      r.region_id || null,
      r.office_id || null,
      r.function_id || null,
      r.dealboard_id || null,
      r.sector_id || null,
      r.revenue_stream_id || null,
      r.consultant_id || null,
      r.metric_value,
      r.target_value,
    ]);

    await conn.query(
      `
      INSERT INTO fact_daily_metrics (
        metric_date, metric_id, region_id, office_id, function_id,
        dealboard_id, sector_id, revenue_stream_id, consultant_id,
        metric_value, target_value
      )
      VALUES ?
      ON DUPLICATE KEY UPDATE
        metric_value = VALUES(metric_value),
        target_value = VALUES(target_value)
      `,
      [values] // ✅ Pass array-of-arrays here
    );
  }

  console.log(`✅ Inserted ${rows.length} rows into fact_daily_metrics`);
}
