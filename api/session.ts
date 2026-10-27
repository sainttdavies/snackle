import { getSql, ensureSchema } from '../lib/db';
import { json, getCookie } from '../lib/respond';
import { createHash } from 'node:crypto';

const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export default async function handler(req: any, res: any) {
  try {
    await ensureSchema();
    const sql = getSql();
    const cookie = getCookie(req, 'snackle_session') || '';
    const session = await sql`SELECT * FROM sessions WHERE token = ${digest(cookie)} AND expires > ${Date.now()}`.then(r => r[0]);
    const owner = await sql`SELECT id FROM owner WHERE id = 1`.then(r => r[0]);
    json(res, 200, {
      authenticated: !!session,
      csrf: session?.csrf,
      configured: !!owner,
    });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Session error' });
  }
}
