import { createApp } from '../server/server.mjs';
import { randomBytes, scryptSync } from 'node:crypto';
import { emitKeypressEvents } from 'node:readline';

if(!process.stdin.isTTY)throw Error('Run this command in an interactive terminal.');
const {db}=createApp();
const email=db.prepare('SELECT email FROM owner WHERE id=1').get()?.email || 'cindyafidoku0@gmail.com';
if(db.prepare('SELECT id FROM owner WHERE id=1').get() && !process.argv.includes('--reset-password')) { console.log('The single owner is already configured. Use --reset-password to rotate the password.'); process.exit(0); }
function secret(prompt) { return new Promise(resolve=>{process.stdout.write(prompt);emitKeypressEvents(process.stdin);process.stdin.setRawMode(true);process.stdin.resume();let value='';const listener=(str,key)=>{if(key?.ctrl && key.name==='c')process.exit(1);if(key?.name==='return'){process.stdin.off('keypress',listener);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');resolve(value);}else if(key?.name==='backspace')value=value.slice(0,-1);else if(str && !key?.ctrl)value+=str;};process.stdin.on('keypress',listener);}); }
console.log(`Configure the sole Snackle owner: ${email}`);
const password=await secret('Choose a password (at least 14 characters; input hidden): ');
if(password.length<14 || password.length>256)throw Error('Password must be 14–256 characters.');
if(password!==await secret('Confirm password: '))throw Error('Passwords do not match.');
const salt=randomBytes(32).toString('hex'),hash=scryptSync(password,salt,64).toString('hex');
db.prepare('INSERT INTO owner VALUES (1,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,salt=excluded.salt,hash=excluded.hash').run(email,salt,hash);db.exec('DELETE FROM sessions');console.log('Owner access configured. Your private login: /#/manage/'+db.prepare('SELECT slug FROM owner_access WHERE id=1').get().slug);db.close();
