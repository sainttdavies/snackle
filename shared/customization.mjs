import defaults from './customization.json' with {type:'json'};
export const safeAsset = v => typeof v==='string' && v.length<=2000 && !/[\\\u0000-\u0020]/.test(v) && (/^\/(?!\/)/.test(v) || /^https:\/\//.test(v));
export function hydrateCustomization(config={}) {
  return Object.fromEntries(Object.entries(defaults).map(([group,values])=>[group,{...values,...(config[group]||{})}]));
}
export function validCustomization(config) {
  for(const [group,values] of Object.entries(defaults)) {
    if(config[group]===undefined)continue;
    if(!config[group] || typeof config[group]!=='object' || Array.isArray(config[group]))return false;
    for(const [key,value] of Object.entries(config[group])) {
      if(!(key in values) || typeof value !== typeof values[key])return false;
      if(typeof value==='string' && value.length>5000)return false;
      if(['background','ink','accent','highlight'].includes(key) && !/^#[\da-f]{6}$/i.test(value))return false;
      if((['logo','footerLogo','favicon','thumbnail','image'].includes(key)||key.endsWith('Image')) && value!=='' && !safeAsset(value))return false;
    }
  }
  const c=hydrateCustomization(config);
  return ['DM Sans','Quantico','Georgia'].includes(c.brand.bodyFont) && ['Barlow Condensed','Quantico','Georgia'].includes(c.brand.headingFont) && ['GHS','USD','GBP','EUR'].includes(c.service.currency) && c.service.country==='Ghana' && c.service.city.trim().length>0 && c.service.areas.trim().length>0 && c.service.areas.split('\n').filter(Boolean).length<=50 && c.carousel.seconds>=3 && c.carousel.seconds<=30 && Number.isInteger(c.carousel.seconds) && c.brand.name.trim().length>0 && safeAsset(c.brand.logo) && safeAsset(c.brand.favicon);
}
