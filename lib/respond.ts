import type postgres from 'postgres';

export function json(res: any, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.APP_ORIGIN || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
}

export function getCookie(req: any, name: string): string | undefined {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? match[1] : undefined;
}

export function parseBody(req: any): Promise<any> {
  try {
    if (req.body !== undefined && req.body !== null) {
      if (Buffer.isBuffer(req.body)) {
        return Promise.resolve(req.body.length ? JSON.parse(req.body.toString('utf8')) : {});
      }
      if (typeof req.body === 'string') {
        return Promise.resolve(req.body ? JSON.parse(req.body) : {});
      }
      return Promise.resolve(req.body);
    }
  } catch {
    return Promise.resolve({});
  }
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

export function checkOrigin(req: any, origin: string): boolean {
  return req.headers.origin === origin;
}

export async function rateLimit(sql: postgres.Sql, key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const row = await sql`SELECT count, reset FROM rate_limits WHERE key = ${key}`.then(r => r[0]);
  if (!row || row.reset < now) {
    await sql`INSERT INTO rate_limits (key, count, reset) VALUES (${key}, 1, ${now + windowMs}) ON CONFLICT (key) DO UPDATE SET count = 1, reset = ${now + windowMs}`;
    return true;
  }
  if (row.count >= limit) return false;
  await sql`UPDATE rate_limits SET count = count + 1 WHERE key = ${key}`;
  return true;
}
