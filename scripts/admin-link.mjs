import {createApp} from '../server/server.mjs';
const {db}=createApp();
console.log((process.env.APP_ORIGIN||'http://127.0.0.1:5173')+'/#/manage/'+db.prepare('SELECT slug FROM owner_access WHERE id=1').get().slug);
db.close();
