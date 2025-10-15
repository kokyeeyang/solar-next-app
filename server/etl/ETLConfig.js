// server/etl/etlConfig.js
export const START_DATE = "2025-01-01";
export const END_DATE = "2025-10-14";

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
