import { getSql, ensureSchema } from '../lib/db.js';
import { json } from '../lib/respond.js';

export default async function handler(_req: any, res: any) {
  try {
    await ensureSchema();
    const sql = getSql();
    const rows = await sql`SELECT value FROM products ORDER BY id`;
    const products = rows.map((row) => JSON.parse(row.value)).sort((a,b)=>(a.sortOrder??9999)-(b.sortOrder??9999)||a.id.localeCompare(b.id));
    const settings = await sql`SELECT value FROM settings WHERE id = 1`.then(r => r[0]);
    const currency = settings ? JSON.parse(settings.value)?.service?.currency : undefined;
    json(res, 200, { products, currency: ['GHS','USD','GBP','EUR'].includes(currency) ? currency : 'GHS' });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Catalog error' });
  }
}
