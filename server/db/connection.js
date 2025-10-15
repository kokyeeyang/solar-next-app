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

/**
 * 📊 Simple query helper (optional)
 * You can use this anywhere else in your codebase for convenience
 */
export const query = async (sql, params) => {
  const [rows] = await reportingDB.execute(sql, params);
  return rows;
};
