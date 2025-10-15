// server/etl/etlConfig.js
const now = new Date();
// 🗓️ Start of the current year (e.g. 2025-01-01)
export const START_DATE = `${now.getFullYear()}-01-01`;

// 📅 Today's date in YYYY-MM-DD
export const END_DATE = now.toISOString().split("T")[0];

export const REGIONS = ["EMEA", "APAC", "Americas"];
export const OFFICES = ["London", "Singapore", "New York", "Kuala Lumpur"];
export const FUNCTIONS = ["Contract", "Permanent"];
export const DEALBOARDS = [
  "Accounts Assembled (LON)",
  "Atomic Written (LON)",
  "Big Fees Big PVs",
  "Billy Big Timers (GLA)",
  "Brogram",
  "Downstream Cowboys",
  "Earth, Wind & Hire (LON)",
  "Eurovision (DUS)",
];
export const SECTORS = ["Renewables", "Oil & Gas", "Power", "Infrastructure"];
export const REVENUE_STREAMS = ["Perm", "Contract"];
export const CONSULTANTS = ["John Doe", "Jane Smith"];

export const MAX_CONCURRENCY = 10; // safe default
export const BATCH_SIZE = 500;
