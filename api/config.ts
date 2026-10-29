import { getSql, ensureSchema } from '../lib/db.js';
import { json } from '../lib/respond.js';
import {hydrateCustomization} from '../shared/customization.mjs';

export default async function handler(_req: any, res: any) {
  try {
    await ensureSchema();
    const sql = getSql();
    const settings = await sql`SELECT value FROM settings WHERE id = 1`.then(r => r[0]);
    const config = settings ? JSON.parse(settings.value) : {};
    const {sections,footer,about}=config;
    json(res, 200, {
      config: {
        sections,footer,about,
        ...hydrateCustomization(config),
        theme: config.theme || 'orange',
      },
    });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Config error' });
  }
}
