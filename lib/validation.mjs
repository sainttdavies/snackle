import {validCustomization,safeAsset} from '../shared/customization.mjs';
const text=(value,min,max)=>typeof value==='string'&&value.length>=min&&value.length<=max;
const hex=value=>typeof value==='string'&&/^#[\da-f]{6}$/i.test(value);
export function validSiteConfig(c){
  return !!c&&validCustomization(c)&&['orange','cream','brown','teal'].includes(c.theme)&&Array.isArray(c.sections)&&c.sections.length>=1&&c.sections.length<=8&&c.sections.every(s=>text(s.id,1,100)&&text(s.ghost,1,80)&&text(s.title,1,100)&&text(s.description,0,2000)&&text(s.cta,1,80)&&hex(s.bg)&&Array.isArray(s.images)&&s.images.length>=1&&s.images.length<=12&&s.images.every(i=>safeAsset(i.src)&&text(i.alt,1,150)&&(i.bg===''||hex(i.bg))))&&!!c.footer&&['tagline','email','phone','location','instagram','tiktok','copyright'].every(k=>text(c.footer[k],0,1000))&&(!c.footer.instagram||/^https:\/\//.test(c.footer.instagram))&&(!c.footer.tiktok||/^https:\/\//.test(c.footer.tiktok))&&!!c.about&&text(c.about.title,1,150)&&text(c.about.body,1,5000);
}
export function validProduct(p){return !!p&&(p.price===null||(typeof p.price==='number'&&Number.isFinite(p.price)&&p.price>0&&p.price<=100000))&&typeof p.available==='boolean'&&text(p.unit,1,80)&&text(p.name,1,120)&&text(p.category,1,60)&&text(p.description,0,1000)&&safeAsset(p.image)&&hex(p.color);}
