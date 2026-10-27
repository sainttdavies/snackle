import { useCallback, useEffect, useState } from 'react';
import { defaultConfig, hydrateConfig, type SiteConfig } from './config';
import { api } from './api';
export function useConfig() {
  const [config,setConfig] = useState<SiteConfig>(defaultConfig);
  const [error,setError] = useState('');
  useEffect(()=>{api('/config').then(data=>{if(data.config)setConfig(hydrateConfig(data.config));}).catch(()=>setError('The kitchen is temporarily offline.'));},[]);
  const update=useCallback((next:SiteConfig)=>setConfig(next),[]);
  const reset=useCallback(()=>setConfig(defaultConfig()),[]);
  return {config,update,reset,error};
}
