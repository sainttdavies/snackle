import { useEffect, useState } from 'react';
import CarouselSection from './CarouselSection';
import Nav from './Nav';
import Footer from './Footer';
import { getTheme, readable, type SiteConfig } from './config';

export default function Site({ config }: { config: SiteConfig }) {
  const theme = getTheme(config.theme);
  const [activeSection, setActiveSection] = useState(0);

  // Which section is under the navbar — drives nav ink colour
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const viewport = window.innerHeight || 1;
        // Section i covers the navbar once scroll passes its flow top (i × viewport)
        const idx = Math.floor((window.scrollY + 2) / viewport);
        setActiveSection(Math.max(0, Math.min(config.sections.length - 1, idx)));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [config.sections.length]);

  const currentBg = config.sections[activeSection]?.bg ?? theme.sectionBgs[0];
  const ink = readable(currentBg);

  return (
    <div style={{ background: '#F2F1F0' }}>
      <Nav config={config} ink={ink} current="#/" />

      {/*
        Sticky wipe/stack: sections are direct children of this static root so their
        containing block spans the footer too — each section pins to the top, the next
        one wipes over it, and the footer finally slides over the last pinned section.
      */}
      {config.sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="snackle-section"
          style={{
            position: 'sticky',
            top: 0,
            height: '100svh',
            overflow: 'hidden',
            background: section.bg,
          }}
        >
          <CarouselSection section={section} />
        </section>
      ))}

      <Footer config={config} />
    </div>
  );
}
