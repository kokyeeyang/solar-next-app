// server/db/connection.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * 🗄️ MySQL connection pool
 * - Uses env vars locally and in GitHub Actions
 * - Automatically enables SSL if connecting to Railway
 * - Supports getConnection(), query(), transactions, etc.
 */
export const reportingDB = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "reporting_db",
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: process.env.DB_HOST?.includes("railway")
    ? { rejectUnauthorized: false }
    : undefined,
});

export const solarDB = mysql.createPool({
  host: process.env.DB_SOLAR_HOST,
  user: process.env.DB_SOLAR_USER,
  password: process.env.DB_SOLAR_PASS || process.env.DB_PASSWORD || "",
  database: process.env.DB_SOLAR_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  ssl:
    process.env.DB_SOLAR_HOST?.includes("mysql.database.azure.com")
      ? { rejectUnauthorized: false }
      : undefined,
});

export const railwayDB = mysql.createPool({
  host: process.env.DB_RAILWAY_HOST,
  user: process.env.DB_RAILWAY_USER,
  password: process.env.DB_RAILWAY_PASS || process.env.DB_PASSWORD || "",
  database: process.env.DB_RAILWAY_NAME,
  port: Number(process.env.DB_RAILWAY_PORT) || 29013,
  waitForConnections: true,
  connectionLimit: 10,
  ssl:
    process.env.DB_RAILWAY_HOST?.includes("metro.proxy.rlwy.net")
      ? { rejectUnauthorized: false }
      : undefined,
});

/**
 * 📊 Simple query helper (optional)
 * You can use this anywhere else in your codebase for convenience
 */
export const query = async (sql, params) => {
  const [rows] = await reportingDB.execute(sql, params);
  return rows;
};

export const solarQuery = async (sql, params) => {
  const [rows] = await solarDB.execute(sql, params);
  return rows;
};

export const railwayQuery = async (sql, params) => {
  const [rows] = await railwayDB.execute(sql, params);
  return rows;
};
