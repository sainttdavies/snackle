import {useEffect,useState,lazy,Suspense} from 'react';import Site from './Site';import {ShopProvider} from './Shop';import {MenuPage,AboutPage,ContactPage,BookingPage,NotFoundPage} from './Pages';import {useConfig} from './useConfig';import {BrandContext,BrandEffects} from './BrandContext';
const OwnerPortal=lazy(()=>import('./OwnerPortal').then(m=>({default:m.OwnerPortal})));
export default function App(){const state=useConfig();const [hash,setHash]=useState(window.location.hash);useEffect(()=>{const update=()=>setHash(window.location.hash);window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);const route=(hash.replace(/^#/,'')||'/').split('?')[0];useEffect(()=>{window.scrollTo(0,0);},[route]);const config=state.config;
let content;const match=route.match(/^\/manage\/([a-z0-9-]{12,80})$/);
if(window.location.pathname!=='/'&&window.location.pathname!=='/index.html')content=<NotFoundPage config={config}/>;
else if(match)content=<Suspense fallback={<main className="login-page">Checking private access…</main>}><OwnerPortal config={config} update={state.update} reset={state.reset} entryKey={match[1]}/></Suspense>;
else if(route==='/')content=<Site config={config}/>;
else if(route==='/admin')content=<OwnerPortal config={config} update={state.update} reset={state.reset} entryKey={config.entryKey||''}/>;
else if(route==='/menu')content=<MenuPage config={config}/>;
else if(route==='/about')content=<AboutPage config={config}/>;
else if(route==='/contact')content=<ContactPage config={config}/>;
else if(route==='/book')content=<BookingPage config={config}/>;
else content=<NotFoundPage config={config}/>;
return <BrandContext.Provider value={config}><BrandEffects/><ShopProvider>{content}</ShopProvider></BrandContext.Provider>;}
