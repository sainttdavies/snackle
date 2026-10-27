import { getSql, ensureSchema } from '../lib/db';
import { json, checkOrigin } from '../lib/respond';
import { randomBytes } from 'node:crypto';

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
    const body = await req.json ? await req.json() : {};
    const { kind, name, email, phone, date, notes = '', fulfilment, address = '', guests, eventType, country = 'Ghana', area, items } = body;
    if (!['order', 'booking'].includes(kind)) {
      json(res, 400, { error: 'Invalid request type.' });
      return;
    }
    if (kind === 'booking') {
      if (!Number.isInteger(guests) || guests < 1 || guests > 10000 || typeof eventType !== 'string' || eventType.length < 2 || typeof address !== 'string' || address.length < 3) {
        json(res, 400, { error: 'Check the guest count, occasion and event location.' });
        return;
      }
    } else {
      if (!['pickup', 'delivery'].includes(fulfilment) || (fulfilment === 'delivery' && (!address || address.length < 5)) || !Array.isArray(items) || items.length < 1 || items.length > 20) {
        json(res, 400, { error: 'Check your basket and delivery details.' });
        return;
      }
    }
    const id = `SN-${randomBytes(6).toString('hex').toUpperCase()}`;
    const record = { name: name.trim(), email: email.trim(), phone, date, notes, country, area, fulfilment, address, guests, eventType, items };
    await sql`INSERT INTO requests (id, kind, status, created, value) VALUES (${id}, ${kind}, 'new', ${new Date().toISOString()}, ${JSON.stringify(record)})`;
    json(res, 201, { id, status: 'new' });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Request error' });
  }
}
