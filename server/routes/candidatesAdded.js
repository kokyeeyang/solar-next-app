// server/routes/metrics.js
import express from "express";
import { railwayDB } from "../db/connection.js";

const router = express.Router();

/**
 * GET /api/metrics/candidatesadded
 * Returns total + target from reporting_db.daily_metrics
 * Optional query params: datefrom, dateto
 */
router.get("/", async (req, res) => {
  try {
    const { datefrom, dateto } = req.query;

    if (!datefrom || !dateto) {
      return res.status(400).json({ error: "Missing date range" });
    }

    console.log(datefrom, dateto)
    const [rows] = await railwayDB.execute(
      `
      SELECT 
        SUM(metric_value) AS total,
        SUM(target_value) AS target
      FROM daily_metrics
      WHERE metric_name = 'candidatesadded'
      AND metric_date BETWEEN ? AND ?;
      `,
      [datefrom, dateto]
    );

    const result = rows[0] || { total: 0, target: 0 };
    return res.json(result);
  } catch (err) {
    console.error("❌ DB error fetching candidatesadded:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
