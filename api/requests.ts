import { getSql, ensureSchema } from '../lib/db.js';
import { json, checkOrigin, parseBody, rateLimit } from '../lib/respond.js';
import { randomBytes } from 'node:crypto';
import {hydrateCustomization} from '../shared/customization.mjs';

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
    const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
    if(!await rateLimit(sql,`request:${ip}`,20,15*60*1000)){
      res.setHeader('Retry-After','900');
      json(res,429,{error:'Too many requests. Please try again later.'});
      return;
    }
    const settings = await sql`SELECT value FROM settings WHERE id = 1`.then(r => r[0]);
    const service = hydrateCustomization(settings ? JSON.parse(settings.value) : {}).service;
    const body = await parseBody(req);
    if(!body||typeof body!=='object'||Array.isArray(body)){json(res,400,{error:'Invalid request.'});return;}
    const { kind, name, email, phone, date, notes = '', fulfilment, address = '', guests, eventType, country = service.country, area, items } = body;
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 120 ||
        typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
        typeof phone !== 'string' || phone.length < 7 || phone.length > 40 || !/^[+\d\s()\-]+$/.test(phone) ||
        typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        typeof notes !== 'string' || notes.length > 2000) {
      json(res, 400, { error: 'Check your contact details, preferred date and notes.' });
      return;
    }
    if (!['order', 'booking'].includes(kind)) {
      json(res, 400, { error: 'Invalid request type.' });
      return;
    }
    const today = new Date().toLocaleDateString('en-CA',{timeZone:service.timezone});
    const allowedAreas = service.areas.split('\n').map((a:string)=>a.trim()).filter(Boolean);
    if(date<today || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date || country!==service.country || ((kind==='booking'||fulfilment==='delivery')&&!allowedAreas.includes(area))){
      json(res,400,{error:'Choose a future date and an available service area.'});
      return;
    }
    let resolvedItems: any[] | undefined;
    let total: number | null | undefined;
    if (kind === 'booking') {
      if(!service.bookingEnabled){json(res,400,{error:'Event enquiries are currently paused.'});return;}
      if (!Number.isInteger(guests) || guests < 1 || guests > 10000 || typeof eventType !== 'string' || eventType.length < 2 || eventType.length>100 || typeof address !== 'string' || address.length < 3 || address.length>500) {
        json(res, 400, { error: 'Check the guest count, occasion and event location.' });
        return;
      }
    } else {
      if((fulfilment==='pickup'&&!service.pickupEnabled)||(fulfilment==='delivery'&&!service.deliveryEnabled)){
        json(res,400,{error:'That fulfilment option is currently unavailable.'});return;
      }
      if (!['pickup', 'delivery'].includes(fulfilment) || (fulfilment === 'delivery' && (typeof address!=='string'||address.length < 5||address.length>500)) || !Array.isArray(items) || items.length < 1 || items.length > 20) {
        json(res, 400, { error: 'Check your basket and delivery details.' });
        return;
      }
      const requested = items as Array<{ id?: unknown; quantity?: unknown }>;
      if (requested.some((item) => !item||typeof item.id !== 'string' || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 99) || new Set(requested.map(item=>item.id)).size!==requested.length) {
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
        : Math.round(resolvedItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)*100)/100;
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
      currency: service.currency,
    };
    await sql`INSERT INTO requests (id, kind, status, created, value) VALUES (${id}, ${kind}, 'new', ${new Date().toISOString()}, ${JSON.stringify(record)})`;
    json(res, 201, { id, status: 'new' });
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Request error' });
  }
}
