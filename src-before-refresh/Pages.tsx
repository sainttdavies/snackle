import Nav from './Nav';
import Footer from './Footer';
import {
  THEMES,
  backgroundFor,
  getTheme,
  readable,
  type SiteConfig,
  type SectionConfig,
} from './config';

function PageShell({
  config,
  current,
  children,
}: {
  config: SiteConfig;
  current: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: '#F2F1F0', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav config={config} current={current} />
      <div style={{ flex: '1 0 auto', paddingTop: 'clamp(90px, 12vh, 140px)' }}>{children}</div>
      <Footer config={config} />
    </div>
  );
}

function PageHeading({ title, accent }: { title: string; accent: string }) {
  return (
    <h1
      style={{
        fontSize: 'clamp(40px, 9vw, 110px)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.01em',
        lineHeight: 0.98,
        color: '#2b3033',
        margin: 0,
      }}
    >
      {title} <span style={{ color: accent }}>{accent && ''}</span>
    </h1>
  );
}

/* ---------------- MENU (Crumbl-style product grid) ---------------- */

function ProductCard({ section, image }: { section: SectionConfig; image: SectionConfig['images'][number] }) {
  const accent = section.bg;
  return (
    <article
      style={{
        background: '#ffffff',
        border: '1px solid #e6e4e1',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 150ms, box-shadow 150ms',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 24px 50px -30px rgba(0,0,0,0.35)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ height: 8, background: accent }} />
      <div
        style={{
          height: 240,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          background: `linear-gradient(180deg, ${backgroundFor(section, 0)}22 0%, ${accent}33 100%)`,
          padding: '20px 24px 0',
        }}
      >
        <img
          src={image.src}
          alt={image.alt}
          draggable={false}
          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
        />
      </div>
      <div style={{ padding: '18px 20px 22px' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#8b9095',
            marginBottom: 6,
          }}
        >
          {section.title}
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            color: '#2b3033',
          }}
        >
          {image.alt}
        </div>
        <div className="flex items-center" style={{ gap: 8, marginTop: 12 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: accent,
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          />
          <span style={{ fontSize: 12, color: '#6b6f72' }}>Available today</span>
        </div>
      </div>
    </article>
  );
}

export function MenuPage({ config }: { config: SiteConfig }) {
  const theme = getTheme(config.theme);
  return (
    <PageShell config={config} current="#/menu">
      <div style={{ padding: '0 clamp(20px, 6vw, 80px)' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: theme.accentDeep,
            marginBottom: 14,
          }}
        >
          Made to order · updated daily
        </div>
        <PageHeading title="THE" accent="" />
        <h1
          style={{
            fontSize: 'clamp(40px, 9vw, 110px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.01em',
            lineHeight: 0.98,
            color: theme.accent,
            margin: 0,
            marginBottom: 'clamp(36px, 6vw, 64px)',
          }}
        >
          MENU
        </h1>

        {config.sections.map((section) => (
          <section key={section.id} style={{ marginBottom: 'clamp(48px, 8vw, 96px)' }}>
            <div
              className="flex items-baseline"
              style={{ gap: 18, flexWrap: 'wrap', marginBottom: 22 }}
            >
              <h2
                style={{
                  fontSize: 'clamp(26px, 4vw, 44px)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  margin: 0,
                  color: '#2b3033',
                }}
              >
                {section.title}
              </h2>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  padding: '5px 12px',
                  borderRadius: 999,
                  background: section.bg,
                  color: readable(section.bg),
                }}
              >
                {section.ghost}
              </span>
            </div>
            <p
              style={{
                maxWidth: 640,
                fontSize: 'clamp(14px, 1.6vw, 17px)',
                lineHeight: 1.7,
                color: '#6b6f72',
                margin: '0 0 30px',
              }}
            >
              {section.description}
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 22,
              }}
            >
              {section.images.map((image, i) => (
                <ProductCard key={`${section.id}-card-${i}`} section={section} image={image} />
              ))}
            </div>
          </section>
        ))}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            alignItems: 'center',
            padding: '28px 32px',
            borderRadius: 16,
            background: theme.accent,
            color: readable(theme.accent),
            marginBottom: 'clamp(48px, 8vw, 96px)',
          }}
        >
          <strong style={{ fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Hungry yet?
          </strong>
          <span style={{ fontSize: 14, opacity: 0.9 }}>
            Everything on this page is fried or pressed after you order.
          </span>
          <a
            href="#/contact"
            className="uppercase"
            style={{
              marginLeft: 'auto',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.14em',
              color: '#1a1c1e',
              background: '#ffffff',
              padding: '13px 26px',
              textDecoration: 'none',
              clipPath:
                'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
            }}
          >
            Order now
          </a>
        </div>
      </div>
    </PageShell>
  );
}

/* ---------------- ABOUT ---------------- */

export function AboutPage({ config }: { config: SiteConfig }) {
  const theme = getTheme(config.theme);
  const values = [
    { label: 'PRESSED DAILY', note: 'Juice made the morning you drink it.' },
    { label: 'FRIED TO ORDER', note: 'Nothing sits under a heat lamp.' },
    { label: 'PACKED IN 30 MIN', note: 'Kitchen to hands, hot and sealed.' },
  ];

  return (
    <PageShell config={config} current="#/about">
      <div style={{ padding: '0 clamp(20px, 6vw, 80px)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'clamp(32px, 6vw, 80px)',
            alignItems: 'start',
            marginBottom: 'clamp(48px, 8vw, 96px)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: theme.accentDeep,
                marginBottom: 14,
              }}
            >
              Our story
            </div>
            <h1
              style={{
                fontSize: 'clamp(40px, 8vw, 96px)',
                fontWeight: 700,
                textTransform: 'uppercase',
                lineHeight: 0.98,
                letterSpacing: '0.01em',
                color: '#2b3033',
                margin: 0,
                marginBottom: 28,
              }}
            >
              {config.about.title}
            </h1>
            <p
              style={{
                fontSize: 'clamp(15px, 1.7vw, 18px)',
                lineHeight: 1.8,
                color: '#6b6f72',
                margin: 0,
                maxWidth: 620,
              }}
            >
              {config.about.body}
            </p>
          </div>

          <div
            style={{
              background: theme.sectionBgs[0],
              borderRadius: 20,
              padding: 'clamp(28px, 4vw, 48px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              minHeight: 320,
              justifyContent: 'center',
            }}
          >
            <img
              src={theme.logo}
              alt="Snackle"
              style={{ height: 64, width: 'auto', alignSelf: 'flex-start' }}
            />
            {values.map((value) => (
              <div key={value.label}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    letterSpacing: '0.1em',
                    color: '#ffffff',
                    marginBottom: 4,
                  }}
                >
                  {value.label}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
                  {value.note}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 'clamp(48px, 8vw, 96px)' }}>
          {THEMES.map((t) => (
            <img
              key={t.id}
              src={t.logo}
              alt={t.name}
              title={t.name}
              style={{
                height: 34,
                width: 'auto',
                opacity: t.id === config.theme ? 1 : 0.35,
                filter: t.id === config.theme ? 'none' : 'grayscale(1)',
              }}
            />
          ))}
        </div>
      </div>
    </PageShell>
  );
}

/* ---------------- CONTACT ---------------- */

export function ContactPage({ config }: { config: SiteConfig }) {
  const theme = getTheme(config.theme);
  const f = config.footer;

  const tile: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e6e4e1',
    borderRadius: 16,
    padding: 'clamp(22px, 3vw, 34px)',
  };

  return (
    <PageShell config={config} current="#/contact">
      <div style={{ padding: '0 clamp(20px, 6vw, 80px)' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: theme.accentDeep,
            marginBottom: 14,
          }}
        >
          We reply fast
        </div>
        <h1
          style={{
            fontSize: 'clamp(40px, 9vw, 110px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            lineHeight: 0.98,
            letterSpacing: '0.01em',
            color: '#2b3033',
            margin: 0,
            marginBottom: 'clamp(32px, 5vw, 56px)',
          }}
        >
          CONTACT <span style={{ color: theme.accent }}>US</span>
        </h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
            marginBottom: 'clamp(36px, 6vw, 64px)',
          }}
        >
          <div style={tile}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#8b9095', textTransform: 'uppercase', marginBottom: 10 }}>
              Email
            </div>
            <a href={`mailto:${f.email}`} style={{ fontSize: 17, fontWeight: 700, color: theme.accentDeep, textDecoration: 'none', wordBreak: 'break-all' }}>
              {f.email}
            </a>
          </div>
          <div style={tile}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#8b9095', textTransform: 'uppercase', marginBottom: 10 }}>
              Phone
            </div>
            <a href={`tel:${f.phone.replace(/\s/g, '')}`} style={{ fontSize: 17, fontWeight: 700, color: theme.accentDeep, textDecoration: 'none' }}>
              {f.phone}
            </a>
          </div>
          <div style={tile}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#8b9095', textTransform: 'uppercase', marginBottom: 10 }}>
              Kitchen
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#2b3033' }}>{f.location}</div>
            <div style={{ fontSize: 13, color: '#6b6f72', marginTop: 6 }}>Mon–Sat 10:00–20:00 · Sun 12:00–18:00</div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            alignItems: 'center',
            padding: 'clamp(26px, 4vw, 44px)',
            borderRadius: 18,
            background: theme.sectionBgs[0],
            marginBottom: 'clamp(48px, 8vw, 96px)',
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, textTransform: 'uppercase', color: '#ffffff', letterSpacing: '0.03em' }}>
              Ready to order?
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>
              Send us a message and we will confirm your drop.
            </div>
          </div>
          <a
            href={`mailto:${f.email}?subject=Snackle%20order`}
            className="uppercase"
            style={{
              marginLeft: 'auto',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.14em',
              color: '#1a1c1e',
              background: theme.accent,
              padding: '16px 30px',
              textDecoration: 'none',
              clipPath:
                'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
            }}
          >
            Send a message
          </a>
        </div>
      </div>
    </PageShell>
  );
}
