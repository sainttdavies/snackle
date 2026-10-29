import {useState} from 'react';
import {csrf} from './api';
import type {SiteConfig, Customization} from './config';

const groups: {key:keyof Customization;title:string;description:string}[] = [
  {key:'brand',title:'Brand & identity',description:'Name, logo, browser details, fonts and core colours.'},
  {key:'service',title:'Service & ordering',description:'Delivery, pickup, bookings, service areas and customer notices.'},
  {key:'navigation',title:'Navigation labels',description:'Labels shown in the site header and footer.'},
  {key:'home',title:'Home page',description:'Ticker, catering feature and story feature.'},
  {key:'pages',title:'Menu, story, catering & contact',description:'Headings, descriptions, buttons, images and form options.'},
  {key:'footerStyle',title:'Footer presentation',description:'Footer callout, wordmark and small print.'},
  {key:'carousel',title:'Carousel details',description:'Rotation timing, badges and section labels.'},
  {key:'loading',title:'Image loading',description:'Placeholders and image error text.'},
  {key:'notFound',title:'Missing page',description:'Text, colour and image for the 404 page.'},
];
const assetKeys=/^(logo|footerLogo|favicon|thumbnail|image|.*Image)$/;
const colourKeys=/^(background|ink|accent|highlight)$/;
const multilineKeys=/^(areas|occasions|bookSteps|.*Title|.*Badge|body)$/;
const label=(key:string)=>key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,s=>s.toUpperCase());

export function AssetField({label:caption,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function upload(file:File|undefined){if(!file)return;setError('');if(file.size>4*1024*1024){setError('Choose an image smaller than 4 MB.');return;}setBusy(true);try{const response=await fetch('/api/admin/images',{method:'POST',headers:{'Content-Type':file.type,'X-CSRF-Token':csrf},body:file});const data=await response.json();if(!response.ok)throw Error(data.error||'Upload failed.');onChange(data.url);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <label className="custom-field"><span>{caption}</span><input value={value} onChange={e=>onChange(e.target.value)} placeholder="/images/example.png or https://…"/>{value&&<img className="asset-preview" src={value} alt="Current asset preview"/>}<span className="asset-upload">{busy?'Uploading…':'Upload image'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{upload(e.target.files?.[0]);e.target.value='';}}/></span>{error&&<small role="alert">{error}</small>}</label>;
}

export default function CustomizationEditor({config,update}:{config:SiteConfig;update:(next:SiteConfig)=>void}){
  function patch(group:keyof Customization,key:string,value:string|boolean|number){update({...config,[group]:{...config[group],[key]:value}});}
  return <div className="customization-editor">{groups.map(({key,title,description})=><details className="custom-group" key={key} open={key==='brand'}><summary><strong>{title}</strong><small>{description}</small></summary><div className="custom-grid">{Object.entries(config[key]).map(([field,value])=>{
    const caption=label(field);const change=(v:string|boolean|number)=>patch(key,field,v);
    if(typeof value==='boolean')return <label className="custom-field custom-checkbox" key={field}><input type="checkbox" checked={value} onChange={e=>change(e.target.checked)}/><span>{caption}</span></label>;
    if(typeof value==='number')return <label className="custom-field" key={field}><span>{caption}</span><input type="number" min={field==='seconds'?3:0} max={field==='seconds'?30:10000} value={value} onChange={e=>change(Number(e.target.value))}/></label>;
    if(assetKeys.test(field))return <AssetField key={field} label={caption} value={value} onChange={change}/>;
    if(key==='brand'&&field==='headingFont'||key==='brand'&&field==='bodyFont')return <label className="custom-field" key={field}><span>{caption}</span><select value={value} onChange={e=>change(e.target.value)}>{(field==='headingFont'?['Barlow Condensed','Quantico','Georgia']:['DM Sans','Quantico','Georgia']).map(font=><option key={font}>{font}</option>)}</select></label>;
    if(key==='service'&&field==='currency')return <label className="custom-field" key={field}><span>{caption}</span><select value={value} onChange={e=>change(e.target.value)}>{['GHS','USD','GBP','EUR'].map(currency=><option key={currency}>{currency}</option>)}</select></label>;
    if(colourKeys.test(field))return <label className="custom-field" key={field}><span>{caption}</span><span className="custom-color"><input value={value} onChange={e=>change(e.target.value)} pattern="#[0-9a-fA-F]{6}"/><input aria-label={`Choose ${caption} colour`} type="color" value={/^#[\da-f]{6}$/i.test(value)?value:'#ffffff'} onChange={e=>change(e.target.value)}/></span></label>;
    if(multilineKeys.test(field)||value.includes('\n')||value.length>160)return <label className="custom-field custom-wide" key={field}><span>{caption}</span><textarea rows={field==='areas'||field==='occasions'?5:3} value={value} onChange={e=>change(e.target.value)}/>{(field==='areas'||field==='occasions'||field==='bookSteps')&&<small>One item per line</small>}</label>;
    return <label className="custom-field" key={field}><span>{caption}</span><input value={value} onChange={e=>change(e.target.value)}/></label>;
  })}</div></details>)}</div>;
}
