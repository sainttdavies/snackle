import {getSql,ensureSchema} from '../../../lib/db.js';
import {json,getCookie,parseBody} from '../../../lib/respond.js';
import {createHash,randomBytes} from 'node:crypto';
import {validProduct} from '../../../lib/validation.mjs';

export default async function handler(req:any,res:any){
  if(req.method!=='POST'){json(res,405,{error:'Method not allowed'});return;}
  try{
    await ensureSchema();
    const sql=getSql();
    const cookie=getCookie(req,'snackle_session')||'';
    const token=createHash('sha256').update(cookie).digest('hex');
    const session=await sql`SELECT * FROM sessions WHERE token = ${token} AND expires > ${Date.now()}`.then(r=>r[0]);
    if(!session){json(res,401,{error:'Please sign in as the owner.'});return;}
    if(req.headers['x-csrf-token']!==session.csrf||req.headers.origin!==(process.env.APP_ORIGIN||'')){json(res,403,{error:'Please refresh and try again.'});return;}
    const body=await parseBody(req);
    if(!validProduct(body)){json(res,400,{error:'Check product details, image URL, colour and price.'});return;}
    const id='product-'+randomBytes(8).toString('hex');
    const product={...body,id};
    await sql`INSERT INTO products (id,value) VALUES (${id},${JSON.stringify(product)})`;
    json(res,201,{ok:true,id});
  }catch(e:any){json(res,500,{error:e.message||'Product creation error'});}
}
