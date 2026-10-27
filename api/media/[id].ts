import { getSql, ensureSchema } from '../../lib/db';
import { json } from '../../lib/respond';

export default async function handler(req: any, res: any) {
  try {
    await ensureSchema();
    const sql = getSql();
    const id = String(req.query?.id || '');
    const row = await sql`SELECT type, url FROM media WHERE id = ${id}`.then(r => r[0]);
    if (!row) {
      json(res, 404, { error: 'Image not found.' });
      return;
    }
    res.writeHead(200, {
      'Content-Type': row.type,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    const encoded = String(row.url).split(',', 2)[1];
    res.end(encoded ? Buffer.from(encoded, 'base64') : row.url);
  } catch (e: any) {
    json(res, 500, { error: e.message || 'Media error' });
  }
}
