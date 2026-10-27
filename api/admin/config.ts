import { getSql, ensureSchema } from '../../lib/db';
import { json, getCookie, parseBody } from '../../lib/respond';
import { createHash } from 'node:crypto';

const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export default async function handler(req: any, res: any) {
  if (req.method !== 'PUT') {
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
    await sql`INSERT INTO settings VALUES (1, ${JSON.stringify(body)}) ON CONFLICT (id) DO UPDATE SET value = ${JSON.stringify(body)}`;
    json(res, 200, { ok: true });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Config save error' });
  }
}
