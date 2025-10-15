import mysql from "mysql2/promise";
import dotenv from "dotenv";

// ✅ Load .env locally (ignored in GitHub Actions if env vars already exist)
dotenv.config();

let pool;

/**
 * 🔌 Create a reusable MySQL connection pool
 * - Automatically supports GitHub Secrets or local .env
 * - Adds SSL if connecting to Railway
 * - Avoids creating multiple pools
 */
export const connectDB = async () => {
  if (!pool) {
    pool = mysql.createPool({
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

    console.log("✅ MySQL connection pool created");
  }

  return pool;
};

/**
 * 📊 Run a SQL query with parameters
 * @param {string} sql - The SQL query string
 * @param {Array} params - Parameters for prepared statements
 * @returns {Promise<Array>} - Query results
 */
export const query = async (sql, params) => {
  const db = await connectDB();
  const [rows] = await db.execute(sql, params);
  return rows;
};

/**
 * 🗄️ Optional: separate reporting database connection (if needed)
 * - Only create this if you truly need a second DB
 * - Otherwise, remove this block entirely
 */
// export const reportingDB = await mysql.createConnection({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASS || process.env.DB_PASSWORD || "",
//   database: process.env.DB_NAME || "reporting_db",
//   port: Number(process.env.DB_PORT) || 3306,
//   ssl: process.env.DB_HOST?.includes("railway") 
//     ? { rejectUnauthorized: false }
//     : undefined,
// });

export const reportingDB = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "reporting_db",
  port: Number(process.env.DB_PORT) || 3306,
  ssl: process.env.DB_HOST?.includes("railway") 
    ? { rejectUnauthorized: false }
    : undefined,
});

