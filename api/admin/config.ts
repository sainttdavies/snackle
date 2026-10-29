import { getSql, ensureSchema } from '../../lib/db.js';
import { json, getCookie, parseBody } from '../../lib/respond.js';
import { createHash } from 'node:crypto';
import {validSiteConfig} from '../../lib/validation.mjs';
import {hydrateCustomization} from '../../shared/customization.mjs';

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
    if (!validSiteConfig(body)) {
      json(res, 400, { error: 'Check the content, image URLs and six-digit colours.' });
      return;
    }
    const publicConfig={theme:body.theme,sections:body.sections,footer:body.footer,about:body.about,...hydrateCustomization(body)};
    await sql`INSERT INTO settings VALUES (1, ${JSON.stringify(publicConfig)}) ON CONFLICT (id) DO UPDATE SET value = ${JSON.stringify(publicConfig)}`;
    json(res, 200, { ok: true });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Config save error' });
  }
}
