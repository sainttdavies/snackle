import { useCallback, useEffect, useState } from 'react';
import { defaultConfig, hydrateConfig, type SiteConfig } from './config';
import { api } from './api';
export function useConfig() {
  const [config,setConfig] = useState<SiteConfig>(defaultConfig);
  const [published,setPublished] = useState<SiteConfig>(defaultConfig);
  const [error,setError] = useState('');
  useEffect(()=>{api('/config').then(data=>{if(data.config){const loaded=hydrateConfig(data.config);setConfig(loaded);setPublished(loaded);}}).catch(()=>setError('The kitchen is temporarily offline.'));},[]);
  const update=useCallback((next:SiteConfig)=>setConfig(next),[]);
  const reset=useCallback(()=>setConfig(defaultConfig()),[]);
  const markPublished=useCallback((next:SiteConfig)=>setPublished(next),[]);
  return {config,update,reset,markPublished,dirty:JSON.stringify(config)!==JSON.stringify(published),error};
}
