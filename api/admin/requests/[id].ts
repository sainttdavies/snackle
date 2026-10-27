import { getSql, ensureSchema } from '../../../lib/db';
import { json, getCookie, parseBody } from '../../../lib/respond';
import { createHash } from 'node:crypto';

const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export default async function handler(req: any, res: any) {
  if (req.method !== 'PATCH') {
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
    const id = String(req.query?.id || '');
    const body = await parseBody(req);
    if (!['new', 'confirmed', 'completed', 'cancelled'].includes(body.status)) {
      json(res, 400, { error: 'Invalid status.' });
      return;
    }
    const result = await sql`UPDATE requests SET status = ${body.status} WHERE id = ${id}`;
    if (result.count === 0) {
      json(res, 404, { error: 'Request not found.' });
      return;
    }
    json(res, 200, { ok: true });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Update error' });
  }
}
