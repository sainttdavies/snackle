import { useEffect, useState } from 'react';
import Site from './Site';
import Admin from './Admin';
import { MenuPage, AboutPage, ContactPage } from './Pages';
import { useConfig } from './useConfig';

export default function App() {
  const { config, update, reset } = useConfig();
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const isAdmin = hash.startsWith('#/admin');
  const isMenu = hash.startsWith('#/menu');
  const isAbout = hash.startsWith('#/about');
  const isContact = hash.startsWith('#/contact');

  // Scroll to the top when entering a non-home page; sections stack on home
  useEffect(() => {
    if (!isAdmin) window.scrollTo(0, 0);
  }, [isAdmin, isMenu, isAbout, isContact]);

  if (isAdmin) return <Admin config={config} update={update} reset={reset} />;
  if (isMenu) return <MenuPage config={config} />;
  if (isAbout) return <AboutPage config={config} />;
  if (isContact) return <ContactPage config={config} />;
  return <Site config={config} />;
}
