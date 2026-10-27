import { getSql, ensureSchema } from '../lib/db.js';
import { json, checkOrigin, parseBody } from '../lib/respond.js';
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
    const body = await parseBody(req);
    const { kind, name, email, phone, date, notes = '', fulfilment, address = '', guests, eventType, country = 'Ghana', area, items } = body;
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 120 ||
        typeof email !== 'string' || !email.includes('@') || email.length > 254 ||
        typeof phone !== 'string' || phone.length < 7 || phone.length > 40 ||
        typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        typeof notes !== 'string' || notes.length > 2000) {
      json(res, 400, { error: 'Check your contact details, preferred date and notes.' });
      return;
    }
    if (!['order', 'booking'].includes(kind)) {
      json(res, 400, { error: 'Invalid request type.' });
      return;
    }
    let resolvedItems: any[] | undefined;
    let total: number | null | undefined;
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
      const requested = items as Array<{ id?: unknown; quantity?: unknown }>;
      if (requested.some((item) => typeof item.id !== 'string' || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 99)) {
        json(res, 400, { error: 'Check the products and quantities in your basket.' });
        return;
      }
      const rows = await sql`SELECT id, value FROM products`;
      const products = new Map(rows.map((row) => [row.id, JSON.parse(row.value)]));
      resolvedItems = requested.map((item) => {
        const product = products.get(item.id as string);
        return product ? {
          id: product.id,
          name: product.name,
          unit: product.unit,
          price: product.price,
          quantity: Number(item.quantity),
          available: product.available,
        } : null;
      }).filter(Boolean);
      if (resolvedItems.length !== requested.length || resolvedItems.some((item) => !item.available)) {
        json(res, 400, { error: 'One or more products are no longer available. Refresh your basket and try again.' });
        return;
      }
      total = resolvedItems.some((item) => item.price === null)
        ? null
        : resolvedItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
      resolvedItems = resolvedItems.map(({ available: _available, ...item }) => item);
    }
    const id = `SN-${randomBytes(6).toString('hex').toUpperCase()}`;
    const record = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone,
      date,
      notes,
      country,
      area,
      fulfilment,
      address,
      guests,
      eventType,
      items: resolvedItems,
      total,
      currency: 'GHS',
    };
    await sql`INSERT INTO requests (id, kind, status, created, value) VALUES (${id}, ${kind}, 'new', ${new Date().toISOString()}, ${JSON.stringify(record)})`;
    json(res, 201, { id, status: 'new' });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Request error' });
  }
}
