import { getSql, ensureSchema } from '../lib/db';
import { json, getCookie } from '../lib/respond';
import { createHash } from 'node:crypto';

const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
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
    const rows = await sql`SELECT id, kind, status, created, value FROM requests ORDER BY created DESC LIMIT 1000`;
    const requests = rows.map((r: any) => ({ ...r, ...JSON.parse(r.value), value: undefined }));
    json(res, 200, { requests });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Requests error' });
  }
}
