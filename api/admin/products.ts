import { getSql, ensureSchema } from '../../lib/db';
import { json, getCookie, parseBody } from '../../lib/respond';
import { createHash, randomBytes } from 'node:crypto';

const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      await ensureSchema();
      const sql = getSql();
      const rows = await sql`SELECT id, value FROM products`;
      const products = rows.map((r: any) => JSON.parse(r.value));
      json(res, 200, { products, currency: 'GHS' });
    } catch (e: any) {
      json(res, 500, { error: e.message || 'Products error' });
    }
    return;
  }
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }
  try {
    await ensureSchema();
    const sql = getSql();
    const cookie = getCookie(req, 'snackle_session') || '';
    const session = await sql`SELECT * FROM sessions WHERE token = ${digest(cookie)} AND expires > ${Date.now()}`.then(r => r[0]);
    if (!session) {
      json(res, 401, { error: 'Please sign in as the owner.' });
      return;
    }
    const csrf = req.headers['x-csrf-token'];
    if (csrf !== session.csrf) {
      json(res, 403, { error: 'Please refresh and try again.' });
      return;
    }
    const origin = process.env.APP_ORIGIN || '';
    if (req.headers.origin !== origin) {
      json(res, 403, { error: 'Request origin is not allowed.' });
      return;
    }
    const body = await parseBody(req);
    const id = 'product-' + randomBytes(8).toString('hex');
    const record = { ...body, id };
    await sql`INSERT INTO products VALUES (${id}, ${JSON.stringify(record)})`;
    json(res, 201, { ok: true, id });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Product create error' });
  }
}
