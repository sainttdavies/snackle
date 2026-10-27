import { getSql, ensureSchema } from '../lib/db';
import { json, getCookie } from '../lib/respond';
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
    // Read multipart body is complex in serverless; accept JSON with base64 data URL instead
    const body = await req.json ? await req.json() : {};
    const { type, data } = body; // data = base64 data URL e.g. "data:image/png;base64,...."
    if (!type || !data) {
      json(res, 400, { error: 'Provide type and data (base64 data URL).' });
      return;
    }
    const id = randomBytes(20).toString('hex');
    await sql`INSERT INTO media VALUES (${id}, ${type}, ${data})`;
    json(res, 201, { url: '/media/' + id });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Image upload error' });
  }
}
