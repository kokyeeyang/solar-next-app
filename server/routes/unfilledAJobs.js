import express from "express";
import { solarQuery } from "../db/connection.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        // Extract query parameters
        const { region, country, function: func, office, team } = req.query;

        // Start building WHERE clause
        let whereClause = "AND YEAR(JO.dateAdded_DT) = YEAR(NOW())";
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
            SELECT JO.entity_id AS JobID, JO.type AS JobPriority, JO.correlatedCustomText6 AS JobType, JO.employmentType, JO.owner_id, CONCAT(JO.owner_firstName, " ", JO.owner_lastName) AS owner, 
            JH.SO_Function__c AS 'function', JH.SO_Region_Assigned__c AS region, JH.SO_Office__c AS office, JH.SO_Team__c AS team, JH.SO_Dealboard_Team__c AS dealboard, BC.sector
            FROM trb_dm_joborder JO
            LEFT JOIN trb_dm_CorporateUser CU ON CU.entity_id = JO.owner_id
            LEFT JOIN trb_dm_hr_job_history JH ON JO.owner_id = JH.Bullhorn_User_ID__c
            LEFT JOIN trb_dm_budget_codes BC ON BC.team = SUBSTRING_INDEX(CU.occupation,' ',1)
            WHERE JO.type = 1
            ${whereClause}
            AND JO.entity_id NOT IN
            (
                SELECT JobID
                FROM trb_dm_written_business
            )
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
    let whereClause = "AND YEAR(JO.dateAdded_DT) = YEAR(NOW())";
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
        SELECT JO.entity_id AS JobID, JO.type AS JobPriority, JO.correlatedCustomText6 AS JobType, JO.employmentType, JO.owner_id, CONCAT(JO.owner_firstName, " ", JO.owner_lastName) AS owner, 
        JH.SO_Function__c AS 'function', JH.SO_Region_Assigned__c AS region, JH.SO_Office__c AS office, JH.SO_Team__c AS team, JH.SO_Dealboard_Team__c AS dealboard, BC.sector
        FROM trb_dm_joborder JO
        LEFT JOIN trb_dm_CorporateUser CU ON CU.entity_id = JO.owner_id
        LEFT JOIN trb_dm_hr_job_history JH ON JO.owner_id = JH.Bullhorn_User_ID__c
        LEFT JOIN trb_dm_budget_codes BC ON BC.team = SUBSTRING_INDEX(CU.occupation,' ',1)
        WHERE JO.type = 1
        ${whereClause}
        AND JO.entity_id NOT IN
        (
            SELECT JobID
            FROM trb_dm_written_business
        )
        GROUP BY JO.entity_id, JO.dateAdded_DT
    `;

    const rows = await solarQuery(sql, params);
    const { Parser } = await import("json2csv");
    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment("unfilled-a-jobs.csv");
    res.send(csv);
});

router.get("/chart", async (req, res) => {
  try {
    // Reuse filters for consistency
    const { region, country, function: func, office, team, groupBy = "team" } = req.query;

    let whereClause = "AND YEAR(JO.dateAdded_DT) = YEAR(NOW())";
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
        SELECT ${groupByColumn} AS GroupName,
        COUNT(JO.entity_id) AS UnfilledAJobs
        FROM trb_dm_joborder JO
        LEFT JOIN trb_dm_CorporateUser CU ON CU.entity_id = JO.owner_id
        LEFT JOIN trb_dm_hr_job_history JH ON JO.owner_id = JH.Bullhorn_User_ID__c
        LEFT JOIN trb_dm_budget_codes BC ON BC.team = SUBSTRING_INDEX(CU.occupation,' ',1)
        WHERE JO.type = 1
        ${whereClause}
        AND JO.entity_id NOT IN
        (
            SELECT JobID
            FROM trb_dm_written_business
        )
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
