import { getSql, ensureSchema } from '../lib/db';
import { json, getCookie, checkOrigin, rateLimit } from '../lib/respond';
import { randomBytes, timingSafeEqual, createHash, scryptSync } from 'node:crypto';

const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }
  const origin = process.env.APP_ORIGIN || '';
  if (!checkOrigin(req, origin)) {
    json(res, 403, { error: 'Request origin is not allowed.' });
    return;
  }
  try {
    await ensureSchema();
    const sql = getSql();
    const ip = req.socket?.remoteAddress || 'unknown';
    const key = `login:${ip}`;
    const ok = await rateLimit(sql, key, 10, 15 * 60 * 1000);
    if (!ok) {
      res.setHeader('Retry-After', '900');
      json(res, 429, { error: 'Too many attempts. Please try again in 15 minutes.' });
      return;
    }
    const body = await (req as any).json ? await (req as any).json() : {};
    const { email, password, entryKey } = body;
    const access = await sql`SELECT slug FROM owner_access WHERE id = 1`.then(r => r[0]);
    if (!access || entryKey !== access.slug) {
      json(res, 404, { error: 'Not found.' });
      return;
    }
    const owner = await sql`SELECT * FROM owner WHERE id = 1`.then(r => r[0]);
    if (!owner) {
      json(res, 503, { error: 'Owner sign-in has not been activated yet.' });
      return;
    }
    if (typeof email !== 'string' || typeof password !== 'string' || password.length < 1 || password.length > 256) {
      json(res, 401, { error: 'Email or password is incorrect.' });
      return;
    }
    const hash = scryptSync(password, owner.salt, 64);
    if (!timingSafeEqual(hash, Buffer.from(owner.hash, 'hex')) || email.trim().toLowerCase() !== owner.email) {
      json(res, 401, { error: 'Email or password is incorrect.' });
      return;
    }
    const token = randomBytes(32).toString('hex');
    const csrf = randomBytes(32).toString('hex');
    await sql`DELETE FROM sessions WHERE expires < ${Date.now()}`;
    await sql`INSERT INTO sessions VALUES (${digest(token)}, ${csrf}, ${Date.now() + 8 * 60 * 60 * 1000})`;
    const secure = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', `snackle_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure ? '; Secure' : ''}`);
    json(res, 200, { authenticated: true, csrf });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Login error' });
  }
}
