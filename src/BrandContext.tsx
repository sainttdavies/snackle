import {createContext,useContext,useEffect} from 'react';
import {defaultConfig,type SiteConfig} from './config';
export const BrandContext=createContext<SiteConfig>(defaultConfig());
export const useBrand=()=>useContext(BrandContext);
export function BrandEffects(){const config=useBrand();useEffect(()=>{
 const b=config.brand,l=config.loading,root=document.documentElement;
 for(const [key,value] of Object.entries({'--cream':b.background,'--brown':b.ink,'--orange':b.accent,'--teal':b.highlight,'--heading-font':`'${b.headingFont}'`,'--body-font':`'${b.bodyFont}'`,'--skeleton-bg':l.background,'--skeleton-highlight':l.highlight}))root.style.setProperty(key,value);
 document.title=b.title;document.querySelector('meta[name="description"]')?.setAttribute('content',b.description);
 let favicon=document.querySelector<HTMLLinkElement>('link[rel="icon"]');if(!favicon){favicon=document.createElement('link');favicon.rel='icon';document.head.appendChild(favicon);}favicon.href=b.favicon;
},[config]);return null;}
