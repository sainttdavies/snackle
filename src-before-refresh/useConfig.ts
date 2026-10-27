import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEY, defaultConfig, loadConfig, saveConfig, type SiteConfig } from './config';

export function useConfig() {
  const [config, setConfig] = useState<SiteConfig>(() => loadConfig());

  const update = useCallback((next: SiteConfig) => {
    setConfig(next);
    saveConfig(next);
  }, []);

  const reset = useCallback(() => {
    const fresh = defaultConfig();
    setConfig(fresh);
    saveConfig(fresh);
  }, []);

  // Keep admin tabs and the site in sync
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        setConfig(JSON.parse(event.newValue));
      } catch {
        // ignore malformed payload
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { config, update, reset };
}
