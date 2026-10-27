import { getSql, ensureSchema } from '../../lib/db.js';
import { json, getCookie } from '../../lib/respond.js';
import { createHash, randomBytes } from 'node:crypto';

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
    const type = String(req.headers['content-type'] || '').split(';')[0].toLowerCase();
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(type)) {
      json(res, 400, { error: 'Choose a PNG, JPEG or WebP image.' });
      return;
    }
    const data = Buffer.isBuffer(req.body)
      ? req.body
      : typeof req.body === 'string'
        ? Buffer.from(req.body, 'binary')
        : Buffer.alloc(0);
    if (!data.length || data.length > 4 * 1024 * 1024) {
      json(res, 400, { error: 'Choose an image smaller than 4 MB.' });
      return;
    }
    const id = randomBytes(20).toString('hex');
    const dataUrl = `data:${type};base64,${data.toString('base64')}`;
    await sql`INSERT INTO media VALUES (${id}, ${type}, ${dataUrl})`;
    json(res, 201, { url: '/media/' + id });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Image upload error' });
  }
}
