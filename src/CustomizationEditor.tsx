import {useState} from 'react';
import {csrf} from './api';
import type {SiteConfig, Customization} from './config';
import defaults from '../shared/customization.json';

const groups: {key:keyof Customization;title:string;description:string;fields?:string[]}[] = [
  {key:'brand',title:'Brand & identity',description:'Name, logo, browser details, fonts and core colours.'},
  {key:'service',title:'Service & ordering',description:'Delivery, pickup, bookings, service areas and customer notices.'},
  {key:'navigation',title:'Navigation labels',description:'Labels shown in the site header and footer.'},
  {key:'home',title:'Home page',description:'Ticker, catering feature and story feature.'},
  {key:'pages',title:'Menu, story, catering & contact',description:'Headings, descriptions, buttons, images and form options.'},
  {key:'footerStyle',title:'Footer presentation',description:'Footer callout, wordmark and small print.'},
  {key:'carousel',title:'Carousel details',description:'Rotation timing, badges and section labels.'},
  {key:'loading',title:'Image loading',description:'Placeholders and image error text.'},
  {key:'ui',title:'Navigation & carousel text',description:'Labels read by visitors and assistive technology.',fields:['skipLink','mainNavigation','brandHome','openBag','openNavigation','closeNavigation','carouselImages','carouselPrevious','carouselNext','carouselPlay','carouselPause','slidePosition','menuCategories']},
  {key:'ui',title:'Menu & bag copy',description:'Product states, basket details and order confirmation. Keep {name}, {count} and {reference} where needed.',fields:['menuEmpty','priceOnRequest','unavailable','addToBag','addedToBag','bagTitle','orderReceivedTitle','orderReceivedBody','keepExploring','emptyBagTitle','emptyBagBody','exploreMenu','unavailableItem','removeUnavailable','removeOne','addOne','removeItem','pricing','subtotal','quoteConfirmation','basketFinePrint','closeBag']},
  {key:'ui',title:'Order form copy',description:'Customer fields, pickup, delivery and order request text.',fields:['orderFormTitle','pickup','delivery','deliveryAddress','preferredDate','orderNotes','orderNotesPlaceholder','sending','sendOrder','orderPrivacy','customerName','customerEmail','customerPhone','country','serviceArea','chooseArea']},
  {key:'ui',title:'Booking form copy',description:'Event enquiry fields, confirmation and paused state.',fields:['occasion','chooseOccasion','guestCount','eventDate','eventLocation','eventNotes','eventNotesPlaceholder','sendBooking','bookingPrivacy','bookingReceivedTitle','bookingReceivedBody','backHome','bookingPaused']},
  {key:'ui',title:'Social link labels',description:'Labels for the footer social links.',fields:['socialInstagram','socialTikTok']},
  {key:'notFound',title:'Missing page',description:'Text, colour and image for the 404 page.'},
];
const assetKeys=/^(logo|footerLogo|favicon|thumbnail|productThumbnail|image|.*Image)$/;
const colourKeys=/^(background|ink|accent|highlight|skeletonLineColor)$/;
const multilineKeys=/^(areas|occasions|bookSteps|.*Title|.*Badge|body)$/;
const label=(key:string)=>key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,s=>s.toUpperCase());

export function AssetField({label:caption,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function upload(file:File|undefined){if(!file)return;setError('');if(file.size>4*1024*1024){setError('Choose an image smaller than 4 MB.');return;}setBusy(true);try{const response=await fetch('/api/admin/images',{method:'POST',headers:{'Content-Type':file.type,'X-CSRF-Token':csrf},body:file});const data=await response.json();if(!response.ok)throw Error(data.error||'Upload failed.');onChange(data.url);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <label className="custom-field"><span>{caption}</span><input value={value} onChange={e=>onChange(e.target.value)} placeholder="/images/example.png or https://…"/>{value&&<img className="asset-preview" src={value} alt="Current asset preview"/>}<span className="asset-upload">{busy?'Uploading…':'Upload image'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{upload(e.target.files?.[0]);e.target.value='';}}/></span>{error&&<small role="alert">{error}</small>}</label>;
}

export default function CustomizationEditor({config,update}:{config:SiteConfig;update:(next:SiteConfig)=>void}){
  function patch(group:keyof Customization,key:string,value:string|boolean|number){update({...config,[group]:{...config[group],[key]:value}});}
  return <div className="customization-editor">{groups.map(({key,title,description,fields})=><details className="custom-group" key={title} open={key==='brand'}><summary><strong>{title}</strong><small>{description}</small></summary><div className="custom-grid">{Object.entries(config[key]).filter(([field])=>!fields||fields.includes(field)).map(([field,value])=>{
    const caption=label(field);const change=(v:string|boolean|number)=>patch(key,field,v);
    const template=key==='ui'?(defaults.ui as Record<string,string>)[field]:value;
    const tokens=typeof template==='string'?[...template.matchAll(/\{[a-zA-Z]+\}/g)].map(match=>match[0]):[];
    if(typeof value==='boolean')return <label className="custom-field custom-checkbox" key={field}><input type="checkbox" checked={value} onChange={e=>change(e.target.checked)}/><span>{caption}</span></label>;
    if(typeof value==='number')return <label className="custom-field" key={field}><span>{caption}</span><input type="number" min={field==='seconds'?3:field==='skeletonCount'?1:0} max={field==='seconds'?30:field==='skeletonCount'?12:field==='skeletonRadius'?40:10000} value={value} onChange={e=>change(Number(e.target.value))}/></label>;
    if(assetKeys.test(field))return <AssetField key={field} label={caption} value={value} onChange={change}/>;
    if(key==='brand'&&field==='headingFont'||key==='brand'&&field==='bodyFont')return <label className="custom-field" key={field}><span>{caption}</span><select value={value} onChange={e=>change(e.target.value)}>{(field==='headingFont'?['Barlow Condensed','Quantico','Georgia']:['DM Sans','Quantico','Georgia']).map(font=><option key={font}>{font}</option>)}</select></label>;
    if(key==='service'&&field==='currency')return <label className="custom-field" key={field}><span>{caption}</span><select value={value} onChange={e=>change(e.target.value)}>{['GHS','USD','GBP','EUR'].map(currency=><option key={currency}>{currency}</option>)}</select></label>;
    if(colourKeys.test(field))return <label className="custom-field" key={field}><span>{caption}</span><span className="custom-color"><input value={value} onChange={e=>change(e.target.value)} pattern="#[0-9a-fA-F]{6}"/><input aria-label={`Choose ${caption} colour`} type="color" value={/^#[\da-f]{6}$/i.test(value)?value:'#ffffff'} onChange={e=>change(e.target.value)}/></span></label>;
    if(multilineKeys.test(field)||value.includes('\n')||value.length>160)return <label className="custom-field custom-wide" key={field}><span>{caption}</span><textarea rows={field==='areas'||field==='occasions'?5:3} value={value} onChange={e=>change(e.target.value)}/>{(field==='areas'||field==='occasions'||field==='bookSteps')&&<small>One item per line</small>}{tokens.length>0&&<small>Keep {tokens.join(', ')} in this text so the customer sees the correct details.</small>}</label>;
    return <label className="custom-field" key={field}><span>{caption}</span><input value={value} onChange={e=>change(e.target.value)}/>{tokens.length>0&&<small>Keep {tokens.join(', ')} in this text.</small>}</label>;
  })}</div>{key==='loading'&&<div className="skeleton-preview" style={{'--skeleton-bg':config.loading.background,'--skeleton-highlight':config.loading.highlight,'--skeleton-line':config.loading.skeletonLineColor,'--skeleton-radius':`${config.loading.skeletonRadius}px`} as React.CSSProperties}><div className="skeleton-card"><div className={`skeleton-thumb ${config.loading.shimmer?'shimmer':''}`} style={{backgroundImage:config.loading.productThumbnail||config.loading.thumbnail?`url("${config.loading.productThumbnail||config.loading.thumbnail}")`:undefined}}/><div className="skeleton-line"/><div className="skeleton-line short"/></div><p>Live preview of the product loading card. Upload a product thumbnail to show it here and while the menu loads.</p></div>}</details>)}</div>;
}
