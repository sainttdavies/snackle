import { getSql, ensureSchema } from '../lib/db.js';
import { json } from '../lib/respond.js';

export default async function handler(_req: any, res: any) {
  try {
    await ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT value FROM products ORDER BY id`;
    const products = rows.map((row) => JSON.parse(row.value));
    json(res, 200, { products, currency: 'GHS' });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Catalog error' });
  }
}
