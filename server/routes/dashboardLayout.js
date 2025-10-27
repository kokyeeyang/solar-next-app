import express from "express";
import { railwayDB } from "../db/connection.js";

const router = express.Router();

/**
 * 📥 GET  /api/dashboard-layout/:bullhornId
 * Load dashboard layout for a given user
 */
router.get("/:bullhornId", async (req, res) => {
  const { bullhornId } = req.params;

  try {
    const [rows] = await railwayDB.query(
      "SELECT layout_json, selected_metrics, selected_fixed_metrics FROM dashboard_layouts WHERE bullhorn_id = ? LIMIT 1",
      [bullhornId]
    );

    if (!rows.length) {
      return res.json({ layout_json: null, selected_metrics: [], selected_fixed_metrics: [] });
    }

    const row = rows[0];
    res.json({
      layout_json: JSON.parse(row.layout_json || "{}"),
      selected_metrics: JSON.parse(row.selected_metrics || "[]"),
      selected_fixed_metrics: JSON.parse(row.selected_fixed_metrics || "[]"),
    });
  } catch (err) {
    console.error("❌ Error loading layout:", err);
    res.status(500).json({ error: "Failed to load layout" });
  }
});

/**
 * 💾 POST /api/dashboard-layout/:bullhornId
 * Save dashboard layout for a given user
 */
router.post("/:bullhornId", async (req, res) => {
  const { bullhornId } = req.params;
  const { user_email, layout_json, selected_metrics, selected_fixed_metrics } = req.body;

  try {
    const [existing] = await railwayDB.query(
      "SELECT id FROM dashboard_layouts WHERE bullhorn_id = ? LIMIT 1",
      [bullhornId]
    );

    if (existing.length) {
      await railwayDB.query(
        "UPDATE dashboard_layouts SET layout_json = ?, selected_metrics = ?, selected_fixed_metrics = ?, updated_at = NOW() WHERE bullhorn_id = ?",
        [
          JSON.stringify(layout_json),
          JSON.stringify(selected_metrics),
          JSON.stringify(selected_fixed_metrics),
          bullhornId,
        ]
      );
    } else {
      await railwayDB.query(
        "INSERT INTO dashboard_layouts (user_email, bullhorn_id, layout_json, selected_metrics, selected_fixed_metrics, updated_at) VALUES (?, ?, ?, ?, ?, NOW())",
        [
          user_email,
          bullhornId,
          JSON.stringify(layout_json),
          JSON.stringify(selected_metrics),
          JSON.stringify(selected_fixed_metrics),
        ]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error saving layout:", err);
    res.status(500).json({ error: "Failed to save layout" });
  }
});

export default router;
