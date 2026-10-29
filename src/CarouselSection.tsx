import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Sparkles, Pause, Play } from 'lucide-react';
import SmartImage from './SmartImage';
import {useBrand} from './BrandContext';
import {fillCopy} from './copy';
import { backgroundFor, readable, type SectionConfig } from './config';
export default function CarouselSection({section,index=0}:{section:SectionConfig;index?:number}){
 const config=useBrand();const c=config.carousel;
 const [active,setActive]=useState(0),[paused,setPaused]=useState(false),[hovered,setHovered]=useState(false),[focused,setFocused]=useState(false),[visible,setVisible]=useState(false),[reduced,setReduced]=useState(false);
 const root=useRef<HTMLDivElement>(null),touch=useRef<{x:number;y:number}|null>(null);const count=section.images.length;const selected=count?active%count:0;
 const juice=section.id==='juices',builtIn=juice||section.id==='chops';
 useEffect(()=>{const mq=window.matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(mq.matches);change();mq.addEventListener('change',change);return()=>mq.removeEventListener('change',change);},[]);
 useEffect(()=>{const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting),{threshold:.55});if(root.current)observer.observe(root.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{if(!c.autoplay||paused||hovered||focused||reduced||!visible||count<2)return;const timer=window.setInterval(()=>{if(!document.hidden)setActive(n=>(n+1)%count);},c.seconds*1000);return()=>window.clearInterval(timer);},[paused,hovered,focused,reduced,visible,count,c.autoplay,c.seconds]);
 const go=(direction:number)=>{if(count>1){setActive((selected+direction+count)%count);setPaused(true);}};
 const role=(i:number)=>{if(i===selected)return 'center';if(i===(selected+1)%count)return 'right';if(i===(selected+count-1)%count)return 'left';return 'back';};
 const bg=count?backgroundFor(section,selected):section.bg;
 return <div ref={root} className={`hero-scene ${juice?'juice-scene':'bites-scene'}`} style={{'--scene-bg':bg,color:readable(bg)==='#FFFFFF'?'#fcf4e7':'#492d22'} as CSSProperties} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false);}}>
 <div className="scene-topline"><span>{config.brand.name.toUpperCase()} / {section.collection|| (juice?c.sipCollection:c.biteCollection)}</span><span>{c.topline} <Sparkles size={14}/></span></div>
 <div className="hero-word" aria-hidden="true">{section.ghost}<span>®</span></div>
 <div className="orbit-stage" role="region" aria-roledescription="carousel" aria-label={fillCopy(config.ui.carouselImages,{title:section.title})} tabIndex={0} onKeyDown={e=>{if(e.key==='ArrowLeft'){e.preventDefault();go(-1);}if(e.key==='ArrowRight'){e.preventDefault();go(1);}}} onPointerDown={e=>{touch.current={x:e.clientX,y:e.clientY};}} onPointerUp={e=>{if(!touch.current)return;const dx=e.clientX-touch.current.x,dy=e.clientY-touch.current.y;touch.current=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){go(dx<0?1:-1);}}} onPointerCancel={()=>{touch.current=null;}}>
 {section.images.map((image,i)=><div key={`${section.id}-${i}-${image.src}`} className={`orbit-slide orbit-${role(i)}`} aria-hidden={i!==selected} role="group" aria-roledescription="slide" aria-label={fillCopy(config.ui.slidePosition,{index:i+1,count,alt:image.alt})}><SmartImage src={image.src} alt={image.alt} draggable={false} fetchPriority={index===0&&i===0?'high':'auto'}/></div>)}
 </div>
 <>{c.showBadge&&section.badgeVisible!==false&&<div className="hero-sticker">{(section.badge|| (juice?c.sipBadge:c.biteBadge)).split('\n').map((line,i)=>i===1?<strong key={i}>{line}</strong>:<span key={i}>{line}</span>)}</div>}
 <div className="scene-side-note">{section.note|| (juice?c.sipNote:c.biteNote)}</div></>
 <div className="scene-bottom"><div className="scene-copy"><span className="eyebrow">0{index+1} / {section.eyebrow|| (juice?c.sipEyebrow:c.biteEyebrow)}</span><h1>{section.title}</h1><p>{section.description}</p></div><div className="scene-controls"><div className="carousel-buttons"><button className="round-button" disabled={count<2} aria-label={fillCopy(config.ui.carouselPrevious,{title:section.title})} onClick={()=>go(-1)}><ArrowLeft size={19}/></button><span aria-live={paused?'polite':'off'}>{String(count?selected+1:0).padStart(2,'0')} <span className="muted">/ {String(count).padStart(2,'0')}</span></span><button className="round-button" disabled={count<2} aria-label={fillCopy(config.ui.carouselNext,{title:section.title})} onClick={()=>go(1)}><ArrowRight size={19}/></button>{c.autoplay&&!reduced&&count>1&&<button className="round-button carousel-play" aria-label={paused?config.ui.carouselPlay:config.ui.carouselPause} onClick={()=>setPaused(!paused)}>{paused?<Play size={13}/>:<Pause size={13}/>}</button>}</div><a className="hero-cta" href={section.category?`#/menu?category=${encodeURIComponent(section.category)}`:builtIn?`#/menu?category=${juice?'Sips':'Bites'}`:'#/menu'}>{section.cta}<ArrowUpRight/></a></div></div>
 </div>;
}
