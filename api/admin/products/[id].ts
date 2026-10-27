import { getSql, ensureSchema } from '../../../lib/db';
import { json, getCookie, parseBody } from '../../../lib/respond';
import { createHash } from 'node:crypto';

const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export default async function handler(req: any, res: any) {
  const id = String(req.query?.id || '');
  if (req.method === 'PUT') {
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
      const old = await sql`SELECT value FROM products WHERE id = ${id}`.then(r => r[0]);
      if (!old) {
        json(res, 404, { error: 'Product not found.' });
        return;
      }
      const body = await parseBody(req);
      const next = { ...JSON.parse(old.value), ...body, id };
      await sql`INSERT INTO products VALUES (${id}, ${JSON.stringify(next)}) ON CONFLICT (id) DO UPDATE SET value = ${JSON.stringify(next)}`;
      json(res, 200, { ok: true, id });
    } catch (e: any) {
      json(res, 500, { error: e.message || 'Product update error' });
    }
    return;
  }
  if (req.method === 'DELETE') {
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
      const result = await sql`DELETE FROM products WHERE id = ${id}`;
      if (result.count === 0) {
        json(res, 404, { error: 'Product not found.' });
        return;
      }
      json(res, 200, { ok: true });
    } catch (e: any) {
      json(res, 500, { error: e.message || 'Product delete error' });
    }
    return;
  }
  json(res, 405, { error: 'Method not allowed' });
}
