import http from 'node:http';
import {hydrateCustomization,safeAsset} from '../shared/customization.mjs';
import {validSiteConfig} from '../lib/validation.mjs';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { readFileSync, mkdirSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
export function createApp({ database = process.env.DATABASE_PATH || resolve(root, 'data/snackle.sqlite'), origin = process.env.APP_ORIGIN || 'http://127.0.0.1:5173', production = process.env.NODE_ENV === 'production' } = {}) {
  if (production && !origin.startsWith('https://')) throw Error('Production APP_ORIGIN must use HTTPS');
  if (database !== ':memory:') mkdirSync(resolve(database, '..'), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(database);
  db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, type TEXT NOT NULL, bytes BLOB NOT NULL); CREATE TABLE IF NOT EXISTS owner (id INTEGER PRIMARY KEY CHECK(id=1), email TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, csrf TEXT NOT NULL, expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, kind TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', created TEXT NOT NULL, value TEXT NOT NULL);`);
  db.exec("CREATE TABLE IF NOT EXISTS owner_access (id INTEGER PRIMARY KEY CHECK(id=1), slug TEXT NOT NULL, preferences TEXT NOT NULL)");
  db.prepare('INSERT OR IGNORE INTO owner_access VALUES (1,?,?)').run(randomBytes(18).toString('hex'),JSON.stringify({title:'The kitchen desk.',accent:'#492d22',background:'#fcf4e7',density:'comfortable',defaultTab:'requests'}));
  const privateAccess=()=>db.prepare('SELECT * FROM owner_access WHERE id=1').get();
  const publicConfig=()=>JSON.parse(db.prepare('SELECT value FROM settings WHERE id=1').get()?.value || '{}');
  const service=()=>hydrateCustomization(publicConfig()).service;
  const verifyPassword=(password)=>{const owner=db.prepare('SELECT * FROM owner WHERE id=1').get();return owner && typeof password==='string' && password.length<=256 && timingSafeEqual(scryptSync(password,owner.salt,64),Buffer.from(owner.hash,'hex'));};
  const insert = db.prepare('INSERT OR IGNORE INTO products VALUES (?, ?)');
  for (const p of JSON.parse(readFileSync(resolve(root, 'server/catalog.json')))) insert.run(p.id, JSON.stringify(p));
  const buckets = new Map();
  const digest = token => createHash('sha256').update(token).digest('hex');
  const products = () => db.prepare('SELECT value FROM products').all().map(p => JSON.parse(p.value)).sort((a,b)=>(a.sortOrder??9999)-(b.sortOrder??9999)||a.id.localeCompare(b.id));
  const text = (v, min=1, max=500) => typeof v === 'string' && v.trim().length >= min && v.length <= max;
  const validEmail = v => text(v, 3, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validDate = (v,zone) => text(v,10,10) && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v && v >= new Date().toLocaleDateString('en-CA',{timeZone:zone});
  const safeUrl = safeAsset;
  const configValid = validSiteConfig;
  const server = http.createServer(async (req,res) => {
    res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('X-Frame-Options','DENY'); res.setHeader('Referrer-Policy','strict-origin-when-cross-origin'); res.setHeader('Cache-Control','no-store');
    if (production) { res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains'); res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"); }
    const send = (status, data) => { res.writeHead(status, {'Content-Type':'application/json'}); res.end(JSON.stringify(data)); };
    try {
      const url = new URL(req.url, origin); const path = url.pathname; const method = req.method;
      const cookie = (req.headers.cookie || '').split(';').map(v=>v.trim()).find(v=>v.startsWith('snackle_session='))?.slice(16) || '';
      const session = db.prepare('SELECT * FROM sessions WHERE token=? AND expires>?').get(digest(cookie),Date.now());
      const mutation = !['GET','HEAD','OPTIONS'].includes(method);
      if (path.startsWith('/api/') && mutation && req.headers.origin !== origin) return send(403,{error:'Request origin is not allowed.'});
      if (path.startsWith('/api/admin/') && !session) return send(401,{error:'Please sign in as the owner.'});
      if (path.startsWith('/api/admin/') && mutation && req.headers['x-csrf-token'] !== session.csrf) return send(403,{error:'Please refresh and try again.'});
      if ((mutation && ['/api/login','/api/requests','/api/admin/security'].includes(path)) || path.startsWith('/api/entry/')) {
        const key = `${path.startsWith('/api/entry/')?'/api/entry':path}:${req.socket.remoteAddress}`; const now = Date.now();
        for (const [k,v] of buckets) if (v.reset < now) buckets.delete(k);
        const entry = buckets.get(key) || {count:0,reset:now+15*60*1000}; entry.count++; buckets.set(key,entry);
        if (entry.count > (path==='/api/login'?10:path==='/api/requests'?20:30)) { res.setHeader('Retry-After','900'); return send(429,{error:'Too many attempts. Please try again in 15 minutes.'}); }
      }
      if (path==='/api/admin/images' && method==='POST') {
        const chunks=[];let length=0;
        for await (const chunk of req) {length+=chunk.length;if(length>6*1024*1024)return send(413,{error:'Choose an image smaller than 6 MB.'});chunks.push(chunk);}
        const bytes=Buffer.concat(chunks);let type='';
        if(bytes.length>24 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))type='image/png';
        else if(bytes.length>12 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255)type='image/jpeg';
        else if(bytes.length>16 && bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP')type='image/webp';
        if(!type)return send(400,{error:'Choose a PNG, JPEG or WebP image.'});
        const id=randomBytes(20).toString('hex');db.prepare('INSERT INTO media VALUES (?,?,?)').run(id,type,bytes);return send(201,{url:'/media/'+id});
      }
      if(path.startsWith('/media/') && method==='GET') {
        const media=db.prepare('SELECT type,bytes FROM media WHERE id=?').get(path.slice(7));
        if(!media)return send(404,{error:'Image not found.'});res.writeHead(200,{'Content-Type':media.type,'Cache-Control':'public, max-age=31536000, immutable'});return res.end(Buffer.from(media.bytes));
      }
      let body = {};
      if (mutation) {
        const chunks=[]; let bytes=0;
        for await (const chunk of req) { bytes+=chunk.length; if(bytes>128*1024) return send(413,{error:'Request too large.'}); chunks.push(chunk); }
        try { body=JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { return send(400,{error:'Invalid JSON.'}); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) return send(400,{error:'Invalid request.'});
      }
      if (path==='/api/catalog' && method==='GET') return send(200,{products:products(),currency:service().currency});
      if (path==='/api/config' && method==='GET') {const saved=publicConfig();return send(200,{config:{theme:saved.theme||'orange',sections:saved.sections,footer:saved.footer,about:saved.about,...hydrateCustomization(saved)}});}
      if (path==='/api/session' && method==='GET') return send(200,{authenticated:!!session,csrf:session?.csrf,configured:!!db.prepare('SELECT id FROM owner WHERE id=1').get()});
      if(path.startsWith('/api/entry/') && method==='GET') {
        if(path.slice(11)!==privateAccess().slug)return send(404,{error:'Not found.'});
        return send(200,{authenticated:!!session,csrf:session?.csrf,configured:!!db.prepare('SELECT id FROM owner WHERE id=1').get()});
      }
      if(path==='/api/admin/preferences' && method==='GET')return send(200,JSON.parse(privateAccess().preferences));
      if(path==='/api/admin/preferences' && method==='PUT') {
        if(!text(body.title,1,100)||!/^#[\da-f]{6}$/i.test(body.accent)||!/^#[\da-f]{6}$/i.test(body.background)||!['compact','comfortable'].includes(body.density)||!['requests','products','website'].includes(body.defaultTab))return send(400,{error:'Check dashboard preferences.'});
        db.prepare('UPDATE owner_access SET preferences=? WHERE id=1').run(JSON.stringify({title:body.title,accent:body.accent,background:body.background,density:body.density,defaultTab:body.defaultTab}));return send(200,{ok:true});
      }
      if(path==='/api/admin/security' && method==='GET')return send(200,{email:db.prepare('SELECT email FROM owner WHERE id=1').get().email,slug:privateAccess().slug});
      if(path==='/api/admin/security' && method==='PUT') {
        if(!verifyPassword(body.currentPassword))return send(401,{error:'Your current password is incorrect.'});
        if(!validEmail(body.email)||typeof body.slug!=='string'||!/^[a-z0-9-]{12,80}$/.test(body.slug)|| (body.newPassword!=='' && !text(body.newPassword,14,256)))return send(400,{error:'Use a valid email, a 12–80 character login address (lowercase letters, numbers, hyphens), and a password of at least 14 characters.'});
        db.exec('BEGIN');
        try {
          if(body.newPassword){const salt=randomBytes(32).toString('hex');db.prepare('UPDATE owner SET email=?,salt=?,hash=? WHERE id=1').run(body.email.trim().toLowerCase(),salt,scryptSync(body.newPassword,salt,64).toString('hex'));}
          else db.prepare('UPDATE owner SET email=? WHERE id=1').run(body.email.trim().toLowerCase());
          db.prepare('UPDATE owner_access SET slug=? WHERE id=1').run(body.slug);db.exec('DELETE FROM sessions; COMMIT');
        }catch(e){db.exec('ROLLBACK');throw e;}
        res.setHeader('Set-Cookie',`snackle_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${production?'; Secure':''}`);
        return send(200,{path:'/#/manage/'+body.slug});
      }
      if (path==='/api/login' && method==='POST') {
        if(body.entryKey!==privateAccess().slug)return send(404,{error:'Not found.'});
        const owner = db.prepare('SELECT * FROM owner WHERE id=1').get();
        if (!owner) return send(503,{error:'Owner sign-in has not been activated yet.'});
        if (!validEmail(body.email) || !text(body.password,1,256)) return send(401,{error:'Email or password is incorrect.'});
        const hash=scryptSync(body.password,owner.salt,64);
        if (!timingSafeEqual(hash,Buffer.from(owner.hash,'hex')) || body.email.trim().toLowerCase()!==owner.email) return send(401,{error:'Email or password is incorrect.'});
        const token=randomBytes(32).toString('hex'),csrf=randomBytes(32).toString('hex');
        db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
        db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest(token),csrf,Date.now()+8*60*60*1000);
        res.setHeader('Set-Cookie',`snackle_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${production?'; Secure':''}`);
        return send(200,{authenticated:true,csrf});
      }
      if (path==='/api/admin/logout' && method==='POST') { db.prepare('DELETE FROM sessions WHERE token=?').run(digest(cookie));res.setHeader('Set-Cookie',`snackle_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${production?'; Secure':''}`);return send(200,{ok:true}); }
      if (path==='/api/admin/config' && method==='PUT') {
        if(!configValid(body))return send(400,{error:'Check the content, image URLs and six-digit colours.'});
        const publicSettings={theme:body.theme,sections:body.sections,footer:body.footer,about:body.about,...hydrateCustomization(body)};db.prepare('INSERT INTO settings VALUES (1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(JSON.stringify(publicSettings));return send(200,{ok:true});
      }
      if (path==='/api/requests' && method==='POST') {
        const {kind,name,email,phone,date,notes='',fulfilment,address='',guests,eventType} = body;
        const settings=service();
        if (!['order','booking'].includes(kind) || !text(name,2,120) || !validEmail(email) || !text(phone,7,40) || !/^[+\d\s()\-]+$/.test(phone) || !validDate(date,settings.timezone) || !text(notes,0,2000)) return send(400,{error:'Check your contact details and choose today or a future date.'});
        const areas=settings.areas.split('\n').map(v=>v.trim()).filter(Boolean);
        if(kind==='booking'&&!settings.bookingEnabled)return send(400,{error:'Event enquiries are currently paused.'});
        if(kind==='order'&&((fulfilment==='delivery'&&!settings.deliveryEnabled)||(fulfilment==='pickup'&&!settings.pickupEnabled)))return send(400,{error:'That fulfilment option is currently unavailable.'});
        if((kind==='booking'||fulfilment==='delivery') && (body.country!==settings.country||!areas.includes(body.area)))return send(400,{error:`Choose an available service area in ${settings.country}.`});
        let record={name:name.trim(),email:email.trim(),phone,date,notes,country:settings.country,area:body.area||settings.city};
        if(kind==='order') {
          if(!['pickup','delivery'].includes(fulfilment) || (fulfilment==='delivery' && !text(address,5,500)) || !Array.isArray(body.items) || body.items.length<1 || body.items.length>20) return send(400,{error:'Check your basket and delivery details.'});
          const catalog=products(); const ids=new Set(); const items=[];
          for(const item of body.items) { const p=catalog.find(p=>p.id===item.id && p.available); if(!p || !Number.isInteger(item.quantity) || item.quantity<1 || item.quantity>99 || ids.has(item.id)) return send(400,{error:'Your basket has an unavailable item or invalid quantity.'}); ids.add(item.id); items.push({id:p.id,name:p.name,quantity:item.quantity,unit:p.unit,price:p.price}); }
          record={...record,items,fulfilment,address:fulfilment==='delivery'?address:'',currency:service().currency,total:items.every(i=>i.price!==null)?Math.round(items.reduce((sum,i)=>sum+i.price*i.quantity,0)*100)/100:null};
        } else {
          if (!Number.isInteger(guests) || guests<1 || guests>10000 || !text(eventType,2,100) || !text(address,3,500))return send(400,{error:'Check the guest count, occasion and event location.'});
          record={...record,guests,eventType,address};
        }
        const id=`SN-${randomBytes(6).toString('hex').toUpperCase()}`;
        db.prepare('INSERT INTO requests (id,kind,created,value) VALUES (?,?,?,?)').run(id,kind,new Date().toISOString(),JSON.stringify(record));return send(201,{id,status:'new'});
      }
      if(path==='/api/admin/requests' && method==='GET')return send(200,{requests:db.prepare('SELECT * FROM requests ORDER BY created DESC LIMIT 1000').all().map(r=>({...r,...JSON.parse(r.value),value:undefined}))});
      if(path.startsWith('/api/admin/requests/') && method==='PATCH') {
        if(!['new','confirmed','completed','cancelled'].includes(body.status))return send(400,{error:'Invalid status.'});
        const result=db.prepare('UPDATE requests SET status=? WHERE id=?').run(body.status,path.split('/').pop());return send(result.changes?200:404,result.changes?{ok:true}:{error:'Request not found.'});
      }
      if(path==='/api/admin/products' && method==='POST' || path.startsWith('/api/admin/products/') && method==='PUT') {
        const id=method==='POST'?'product-'+randomBytes(8).toString('hex'):path.split('/').pop();const old=products().find(p=>p.id===id);
        if(method==='PUT'&&!old)return send(404,{error:'Product not found.'});
        const next={...old,...body,id};
        if(!(next.price===null || (typeof next.price==='number' && Number.isFinite(next.price) && next.price>0 && next.price<=100000)) || typeof next.available!=='boolean'||!text(next.unit,1,80)||!text(next.name,1,120)||!text(next.category,1,60)||!text(next.description,0,1000)||!safeAsset(next.image)||!/^#[\da-f]{6}$/i.test(next.color)|| (next.sortOrder!==undefined && (!Number.isInteger(next.sortOrder)||next.sortOrder<0||next.sortOrder>9999)))return send(400,{error:'Check product details, image URL, colour and price.'});
        const record={id,name:next.name,category:next.category,description:next.description,image:next.image,color:next.color,sortOrder:next.sortOrder??9999,unit:next.unit,price:next.price===null?null:Math.round(next.price*100)/100,available:next.available};
        db.prepare('INSERT INTO products VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(id,JSON.stringify(record));return send(method==='POST'?201:200,{ok:true,id});
      }
      if(path.startsWith('/api/admin/products/') && method==='DELETE') {
        const result=db.prepare('DELETE FROM products WHERE id=?').run(path.split('/').pop());return send(result.changes?200:404,result.changes?{ok:true}:{error:'Product not found.'});
      }
      if(path.startsWith('/api/')) return send(404,{error:'Not found.'});
      if(!['GET','HEAD'].includes(method))return send(405,{error:'Method not allowed.'});
      let status=200;const dist=resolve(root,'dist');let file=resolve(dist,'.'+decodeURIComponent(path));
      if(!file.startsWith(dist+'/'))file=resolve(dist,'index.html');
      try { if(!statSync(file).isFile()){file=resolve(dist,'index.html');if(path!=='/')status=404;} } catch { file=resolve(dist,'index.html');if(path!=='/')status=404; }
      const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'};
      res.writeHead(status,{'Content-Type':types[extname(file)] || 'application/octet-stream'});res.end(method==='HEAD'?undefined:readFileSync(file));
    } catch(err) { if(!res.headersSent)send(500,{error:'Something went wrong. Please try again.'}); else res.end(); }
  });
  return {server,db};
}
if(process.argv[1] === fileURLToPath(import.meta.url)) { const {server}=createApp(); server.listen(Number(process.env.PORT || 3001),'127.0.0.1',()=>console.log(`Snackle API: http://127.0.0.1:${process.env.PORT || 3001}`)); }
