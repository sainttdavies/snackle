import { getSql, ensureSchema } from '../lib/db';
import { json } from '../lib/respond';

export default async function handler(req: any, res: any) {
  try {
    await ensureSchema();
    const sql = getSql();
    const products = await sql`SELECT id, name, category, description, image, unit, price, available, color FROM products ORDER BY id`;
    json(res, 200, { products, currency: 'GHS' });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Catalog error' });
  }
}
