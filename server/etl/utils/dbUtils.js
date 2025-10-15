// server/etl/utils/dbUtils.js
export async function batchInsertFacts(conn, rows, batchSize) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await conn.query(
      `
      INSERT INTO fact_daily_metrics (
        metric_date, metric_id, region_id, office_id, function_id,
        dealboard_id, sector_id, revenue_stream_id, consultant_id,
        metric_value, target_value
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        metric_value = VALUES(metric_value),
        target_value = VALUES(target_value)
      `,
      [batch]
    );
    console.log(`💾 Inserted ${i + batch.length}/${rows.length} rows`);
  }
}
