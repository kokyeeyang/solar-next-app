import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let pool;

export const connectDB = async () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
    });
    console.log("✅ MySQL connection pool created");
  }
  return pool;
};

export const query = async (sql, params) => {
  const db = await connectDB();
  const [rows] = await db.execute(sql, params);
  return rows;
};

export const reportingDB = await mysql.createConnection({
  host: "localhost", // or Railway host
  user: "root",
  password: "Allthebest1994!",
  database: "reporting_db",
});

pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: {
    rejectUnauthorized: false, // disables cert verification if you're using self-signed certs
  },
});
