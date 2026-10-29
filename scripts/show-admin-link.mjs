import postgres from 'postgres';
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is not set. Add it to .env first.');
const sql=postgres(process.env.DATABASE_URL,{prepare:false,max:1});
try{
  const access=await sql`SELECT slug FROM owner_access WHERE id = 1`.then(rows=>rows[0]);
  if(!access)throw Error('Owner access is not configured. Run npm run setup:admin first.');
  const origin=(process.env.APP_ORIGIN||'http://localhost:3000').replace(/\/$/,'');
  console.log(`${origin}/#/manage/${access.slug}`);
}finally{await sql.end();}
