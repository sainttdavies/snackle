import postgres from 'postgres';
import { randomBytes, scryptSync } from 'node:crypto';
import { emitKeypressEvents } from 'node:readline';

if (!process.stdin.isTTY) throw Error('Run this command in an interactive terminal.');
if (!process.env.DATABASE_URL) throw Error('DATABASE_URL is not set. Add it to .env or your Vercel env vars.');

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

await sql`
  CREATE TABLE IF NOT EXISTS owner (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    email TEXT NOT NULL,
    salt TEXT NOT NULL,
    hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS owner_access (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    slug TEXT NOT NULL,
    preferences TEXT NOT NULL
  );
`;

const existing = await sql`SELECT id FROM owner WHERE id = 1`.then(r => r[0]);
if (existing && !process.argv.includes('--reset-password')) {
  console.log('The single owner is already configured. Use --reset-password to rotate the password.');
  process.exit(0);
}

const access = await sql`SELECT slug, preferences FROM owner_access WHERE id = 1`.then(r => r[0]);
const email = access?.preferences ? JSON.parse(access.preferences).email || 'cindyafidoku0@gmail.com' : 'cindyafidoku0@gmail.com';

function secret(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let value = '';
    const listener = (str, key) => {
      if (key?.ctrl && key.name === 'c') process.exit(1);
      if (key?.name === 'return') {
        process.stdin.off('keypress', listener);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write('\n');
        resolve(value);
      } else if (key?.name === 'backspace') value = value.slice(0, -1);
      else if (str && !key?.ctrl) value += str;
    };
    process.stdin.on('keypress', listener);
  });
}

console.log(`Configure the sole Snackle owner: ${email}`);
const password = await secret('Choose a password (at least 14 characters; input hidden): ');
if (password.length < 14 || password.length > 256) throw Error('Password must be 14–256 characters.');
if (password !== await secret('Confirm password: ')) throw Error('Passwords do not match.');

const salt = randomBytes(32).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');

await sql`
  INSERT INTO owner VALUES (1, ${email}, ${salt}, ${hash})
  ON CONFLICT (id) DO UPDATE SET email = excluded.email, salt = excluded.salt, hash = excluded.hash
`;

const slug = randomBytes(18).toString('hex');
const preferences = JSON.stringify({
  title: 'The kitchen desk.',
  accent: '#492d22',
  background: '#fcf4e7',
  density: 'comfortable',
  defaultTab: 'requests',
});

await sql`
  INSERT INTO owner_access VALUES (1, ${slug}, ${preferences})
  ON CONFLICT (id) DO UPDATE SET slug = excluded.slug, preferences = excluded.preferences
`;

await sql`DELETE FROM sessions`;
console.log('Owner access configured. Your private login: /#/manage/' + slug);
await sql.end();
process.exit(0);
