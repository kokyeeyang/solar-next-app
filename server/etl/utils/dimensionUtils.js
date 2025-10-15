// server/etl/utils/dimensionUtils.js
const dimCache = {
  dim_metric: {},
  dim_region: {},
  dim_office: {},
  dim_function: {},
  dim_dealboard: {},
  dim_sector: {},
  dim_revenue_stream: {},
  dim_consultant: {},
};

export async function getOrCreateDimension(conn, table, column, value) {
  if (!value) return null;
  if (dimCache[table][value]) return dimCache[table][value];

  const [rows] = await conn.query(`SELECT id FROM ${table} WHERE ${column} = ?`, [value]);
  let id;
  if (rows.length > 0) {
    id = rows[0].id;
  } else {
    await conn.query(`INSERT IGNORE INTO ${table} (${column}) VALUES (?)`, [value]);
    const [newRows] = await conn.query(`SELECT id FROM ${table} WHERE ${column} = ?`, [value]);
    id = newRows[0].id;
  }

  dimCache[table][value] = id;
  return id;
}

export function clearDimensionCache() {
  Object.keys(dimCache).forEach((table) => (dimCache[table] = {}));
}
