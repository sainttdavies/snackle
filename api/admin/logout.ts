import { getSql, ensureSchema } from '../lib/db';
import { json, getCookie } from '../lib/respond';
import { createHash } from 'node:crypto';

const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }
  try {
    await ensureSchema();
    const sql = getSql();
    const cookie = getCookie(req, 'snackle_session') || '';
    await sql`DELETE FROM sessions WHERE token = ${digest(cookie)}`;
    const secure = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', 'snackle_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' + (secure ? '; Secure' : ''));
    json(res, 200, { ok: true });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Logout error' });
  }
}
