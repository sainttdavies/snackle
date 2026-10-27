import postgres from 'postgres';
import { randomBytes } from 'node:crypto';
import catalog from '../server/catalog.json';

let _sql: postgres.Sql | null = null;
let _schema: Promise<void> | null = null;

export function getSql(): postgres.Sql {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw Error('DATABASE_URL is not set. Create a Neon project and add DATABASE_URL to Vercel env vars.');
    }
    _sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 5 });
  }
  return _sql;
}

async function initializeSchema(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS owner (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      email TEXT NOT NULL,
      salt TEXT NOT NULL,
      hash TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS owner_access (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      slug TEXT NOT NULL,
      preferences TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      csrf TEXT NOT NULL,
      expires INTEGER NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      value TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created TEXT NOT NULL,
      value TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      url TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset BIGINT NOT NULL
    )
  `;
  await sql`
    INSERT INTO owner_access (id, slug, preferences)
    VALUES (1, ${randomBytes(18).toString('hex')}, ${JSON.stringify({
      title: 'The kitchen desk.',
      accent: '#492d22',
      background: '#fcf4e7',
      density: 'comfortable',
      defaultTab: 'requests',
    })})
    ON CONFLICT (id) DO NOTHING
  `;
  for (const product of catalog) {
    await sql`
      INSERT INTO products (id, value)
      VALUES (${product.id}, ${JSON.stringify(product)})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

export function ensureSchema(): Promise<void> {
  if (!_schema) {
    _schema = initializeSchema().catch((error) => {
      _schema = null;
      throw error;
    });
  }
  return _schema;
}
