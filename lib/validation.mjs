import {validCustomization,safeAsset} from '../shared/customization.mjs';
const text=(value,min,max)=>typeof value==='string'&&value.length>=min&&value.length<=max;
const hex=value=>typeof value==='string'&&/^#[\da-f]{6}$/i.test(value);
const optionalText=(value,max)=>value===undefined||text(value,0,max);
export function validSiteConfig(c){
  if(!c||!validCustomization(c)||!['orange','cream','brown','teal'].includes(c.theme))return false;
  if(!Array.isArray(c.sections)||c.sections.length<1||c.sections.length>8)return false;
  const ids=new Set(c.sections.map(section=>section.id));
  if(ids.size!==c.sections.length)return false;
  if(!c.sections.every(s=>text(s.id,1,100)&&text(s.ghost,1,80)&&text(s.title,1,100)&&text(s.description,0,2000)&&text(s.cta,1,80)&&hex(s.bg)&&optionalText(s.collection,100)&&optionalText(s.eyebrow,100)&&optionalText(s.note,200)&&optionalText(s.badge,200)&&optionalText(s.category,60)&&(s.badgeVisible===undefined||typeof s.badgeVisible==='boolean')&&Array.isArray(s.images)&&s.images.length>=1&&s.images.length<=12&&s.images.every(i=>safeAsset(i.src)&&text(i.alt,1,150)&&(i.bg===''||hex(i.bg)))))return false;
  if(!c.footer||!['tagline','email','phone','location','instagram','tiktok','copyright'].every(k=>text(c.footer[k],0,1000)))return false;
  if((c.footer.instagram&&!/^https:\/\//.test(c.footer.instagram))||(c.footer.tiktok&&!/^https:\/\//.test(c.footer.tiktok)))return false;
  return !!c.about&&text(c.about.title,1,150)&&text(c.about.body,1,5000);
}

export function validProduct(p){return !!p&&(p.price===null||(typeof p.price==='number'&&Number.isFinite(p.price)&&p.price>0&&p.price<=100000))&&typeof p.available==='boolean'&&text(p.unit,1,80)&&text(p.name,1,120)&&text(p.category,1,60)&&text(p.description,0,1000)&&safeAsset(p.image)&&hex(p.color)&&(p.sortOrder===undefined||(Number.isInteger(p.sortOrder)&&p.sortOrder>=0&&p.sortOrder<=9999));}
