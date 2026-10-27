import { getSql, ensureSchema } from '../lib/db.js';
import { json } from '../lib/respond.js';

export default async function handler(_req: any, res: any) {
  try {
    await ensureSchema();
    const sql = getSql();
    const settings = await sql`SELECT value FROM settings WHERE id = 1`.then(r => r[0]);
    const access = await sql`SELECT slug, preferences FROM owner_access WHERE id = 1`.then(r => r[0]);
    const config = settings ? JSON.parse(settings.value) : {};
    const prefs = access ? JSON.parse(access.preferences) : {};
    json(res, 200, {
      config: {
        ...config,
        ...prefs,
        entryKey: access?.slug,
        theme: config.theme || 'orange',
      },
    });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Config error' });
  }
}
