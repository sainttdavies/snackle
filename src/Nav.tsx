import {useEffect,useState} from 'react';
import {ShoppingBag,Menu,X,ArrowUpRight} from 'lucide-react';
import type {SiteConfig} from './config';
import {useShop} from './Shop';
import {fillCopy} from './copy';

export default function Nav({config,current=''}:{config:SiteConfig;current?:string}){
  const [opened,setOpened]=useState(false);
  const {cart,open}=useShop();
  const count=Object.values(cart).reduce((sum,quantity)=>sum+quantity,0);
  const links=[
    {label:config.navigation.menu,href:'#/menu'},
    {label:config.navigation.about,href:'#/about'},
    ...(config.service.bookingEnabled?[{label:config.navigation.book,href:'#/book'}]:[]),
    {label:config.navigation.contact,href:'#/contact'},
  ];
  useEffect(()=>{
    if(!opened)return;
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpened(false);};
    const media=window.matchMedia('(min-width:701px)');
    const resize=()=>{if(media.matches)setOpened(false);};
    document.addEventListener('keydown',escape);
    media.addEventListener('change',resize);
    return()=>{document.removeEventListener('keydown',escape);media.removeEventListener('change',resize);};
  },[opened]);
  return <>
    <a className="skip-link" href="#main">{config.ui.skipLink}</a>
    <header className="site-nav">
      <a href="#/" aria-label={fillCopy(config.ui.brandHome,{name:config.brand.name})} className="brand" onClick={()=>setOpened(false)}><img src={config.brand.logo} alt={config.brand.name}/></a>
      <nav className={opened?'nav-links is-open':'nav-links'} aria-label={config.ui.mainNavigation} id="site-menu">
        {links.map(link=><a href={link.href} key={link.href} aria-current={current===link.href?'page':undefined} onClick={()=>setOpened(false)}>{link.label}</a>)}
        <a href="#/menu" className="mobile-order-link" onClick={()=>setOpened(false)}>{config.navigation.order}<ArrowUpRight size={18}/></a>
      </nav>
      <div className="nav-actions">
        <a href="#/menu" className="nav-order">{config.navigation.order}<ArrowUpRight size={17}/></a>
        <button className="bag-button" onClick={open} aria-label={fillCopy(config.ui.openBag,{count})}><ShoppingBag size={21}/><span>{count}</span></button>
        <button className="mobile-toggle icon-button" aria-label={opened?config.ui.closeNavigation:config.ui.openNavigation} aria-expanded={opened} aria-controls="site-menu" onClick={()=>setOpened(value=>!value)}>{opened?<X/>:<Menu/>}</button>
      </div>
    </header>
  </>;
}
