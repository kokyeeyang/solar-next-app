import express from "express";
import { solarQuery } from "../db/connection.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Extract query parameters
    const { region, country, function: func, office, team } = req.query;

    // Start building WHERE clause
    let whereClause = "WHERE YEAR(JO.dateAdded_DT) = YEAR(NOW())";
    const params = [];

    if (region) {
      whereClause += " AND JH.SO_Region_Assigned__c = ?";
      params.push(region);
    }
    if (country) {
      whereClause += " AND JH.SO_Country__c = ?";
      params.push(country);
    }
    if (func) {
      whereClause += " AND JH.SO_Function__c = ?";
      params.push(func);
    }
    if (office) {
      whereClause += " AND JH.SO_Office__c = ?";
      params.push(office);
    }
    if (team) {
      whereClause += " AND JH.SO_Team__c = ?";
      params.push(team);
    }

    // Final SQL query
    const sql = `
      SELECT 
        JO.entity_id AS JobID, 
        DATE(JO.dateAdded_DT) AS JobAddedDate, 
        JO.title, 
        JO.status, 
        CONCAT(JO.owner_firstName, " ", JO.owner_lastName) AS JobOwner, 
        JH.SO_Region_Assigned__c AS Region, 
        JH.SO_Country__c AS Country,
        JH.SO_Function__c AS \`Function\`, 
        JH.SO_Office__c AS Office, 
        JH.SO_Team__c AS Team,
        SUM(CASE WHEN DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) <= 3 THEN 1 ELSE 0 END) AS SentWithin3Days,
        SUM(CASE WHEN DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) > 3
                 AND DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) <= 5 THEN 1 ELSE 0 END) AS SentWithin5Days,  
        SUM(CASE WHEN DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) > 5
                 AND DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) <= 14 THEN 1 ELSE 0 END) AS SentWithin2Weeks,
        SUM(CASE WHEN DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) > 14 THEN 1 ELSE 0 END) AS SentAfter2Weeks
      FROM trb_dm_jobOrder JO
      LEFT JOIN trb_dm_Sendout SO 
        ON JO.entity_id = SO.jobOrder_id
      LEFT JOIN trb_dm_hr_job_history JH
        ON JH.Bullhorn_User_ID__c = JO.owner_id
      ${whereClause}
      GROUP BY JO.entity_id, JO.dateAdded_DT
    `;

    const rows = await solarQuery(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ SQL error details:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

router.get("/export", async (req, res) => {
  // Extract query parameters
    const { region, country, function: func, office, team } = req.query;

    // Start building WHERE clause
    let whereClause = "WHERE YEAR(JO.dateAdded_DT) = YEAR(NOW())";
    const params = [];

    if (region) {
      whereClause += " AND JH.SO_Region_Assigned__c = ?";
      params.push(region);
    }
    if (country) {
      whereClause += " AND JH.SO_Country__c = ?";
      params.push(country);
    }
    if (func) {
      whereClause += " AND JH.SO_Function__c = ?";
      params.push(func);
    }
    if (office) {
      whereClause += " AND JH.SO_Office__c = ?";
      params.push(office);
    }
    if (team) {
      whereClause += " AND JH.SO_Team__c = ?";
      params.push(team);
    }

    // Final SQL query
    const sql = `
      SELECT 
        JO.entity_id AS JobID, 
        DATE(JO.dateAdded_DT) AS JobAddedDate, 
        JO.title, 
        JO.status, 
        CONCAT(JO.owner_firstName, " ", JO.owner_lastName) AS JobOwner, 
        JH.SO_Region_Assigned__c AS Region, 
        JH.SO_Country__c AS Country,
        JH.SO_Function__c AS \`Function\`, 
        JH.SO_Office__c AS Office, 
        JH.SO_Team__c AS Team,
        SUM(CASE WHEN DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) <= 3 THEN 1 ELSE 0 END) AS SentWithin3Days,
        SUM(CASE WHEN DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) > 3
                 AND DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) <= 5 THEN 1 ELSE 0 END) AS SentWithin5Days,  
        SUM(CASE WHEN DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) > 5
                 AND DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) <= 14 THEN 1 ELSE 0 END) AS SentWithin2Weeks,
        SUM(CASE WHEN DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) > 14 THEN 1 ELSE 0 END) AS SentAfter2Weeks
      FROM trb_dm_jobOrder JO
      LEFT JOIN trb_dm_Sendout SO 
        ON JO.entity_id = SO.jobOrder_id
      LEFT JOIN trb_dm_hr_job_history JH
        ON JH.Bullhorn_User_ID__c = JO.owner_id
      ${whereClause}
      GROUP BY JO.entity_id, JO.dateAdded_DT
    `;

    const rows = await solarQuery(sql, params);
    const { Parser } = await import("json2csv");
    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment("jobs_to_cvs_sent.csv");
    res.send(csv);
});

router.get("/chart", async (req, res) => {
  try {
    // Reuse filters for consistency
    const { region, country, function: func, office, team, groupBy = "team" } = req.query;

    let whereClause = "WHERE YEAR(JO.dateAdded_DT) = YEAR(NOW())";
    const params = [];

    if (region) {
      whereClause += " AND JH.SO_Region_Assigned__c = ?";
      params.push(region);
    }
    if (country) {
      whereClause += " AND JH.SO_Country__c = ?";
      params.push(country);
    }
    if (func) {
      whereClause += " AND JH.SO_Function__c = ?";
      params.push(func);
    }
    if (office) {
      whereClause += " AND JH.SO_Office__c = ?";
      params.push(office);
    }
    if (team) {
      whereClause += " AND JH.SO_Team__c = ?";
      params.push(team);
    }

    const allowedGroups = {
      team: "JH.SO_Team__c",
      region: "JH.SO_Region_Assigned__c",
      country: "JH.SO_Country__c",
      function: "JH.SO_Function__c",
      office: "JH.SO_Office__c"
    };

    const groupByColumn = allowedGroups[groupBy.toLowerCase()];
    if(!groupByColumn) {
        return res.status(400).json({error: "Invalid groupBy parameter" });
    }

    const sql = `
      SELECT 
        ${groupByColumn} AS GroupName,
        COUNT(JO.entity_id) AS TotalJobs,
        SUM(CASE WHEN DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) <= 3 THEN 1 ELSE 0 END) AS SentWithin3Days,
        SUM(CASE WHEN DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) > 3 
                 AND DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) <= 5 THEN 1 ELSE 0 END) AS SentWithin5Days,
        SUM(CASE WHEN DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) > 5 
                 AND DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) <= 14 THEN 1 ELSE 0 END) AS SentWithin2Weeks,
        SUM(CASE WHEN DATEDIFF(SO.trb_entityCreatedDatetime, JO.dateAdded_DT) > 14 THEN 1 ELSE 0 END) AS SentAfter2Weeks
      FROM trb_dm_jobOrder JO
      LEFT JOIN trb_dm_Sendout SO 
        ON JO.entity_id = SO.jobOrder_id
      LEFT JOIN trb_dm_hr_job_history JH
        ON JH.Bullhorn_User_ID__c = JO.owner_id
      ${whereClause}
      GROUP BY ${groupByColumn}
      ORDER BY ${groupByColumn}
    `;

    const rows = await solarQuery(sql, params);

    res.json(rows);
  } catch (err) {
    console.error("❌ SQL error details:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

export default router;
