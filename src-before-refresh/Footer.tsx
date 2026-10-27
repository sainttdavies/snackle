import { getTheme, type SiteConfig } from './config';

export default function Footer({ config }: { config: SiteConfig }) {
  const theme = getTheme(config.theme);
  const f = config.footer;

  const colTitle: React.CSSProperties = {
    color: theme.accent,
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    marginBottom: 14,
  };

  const linkStyle: React.CSSProperties = {
    color: '#E9E7E4',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.06em',
    lineHeight: 2,
  };

  const grid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 'clamp(28px, 4vw, 56px)',
    maxWidth: 1180,
  };

  return (
    <footer
      className="snackle-footer"
      style={{
        position: 'relative',
        zIndex: 2,
        background: '#141618',
        color: '#E9E7E4',
        padding: 'clamp(10px, 2vw, 16px) clamp(20px, 6vw, 80px) 28px',
      }}
    >
      {/* accent bar */}
      <div
        style={{
          height: 5,
          background: theme.accent,
          borderRadius: 999,
          marginBottom: 'clamp(36px, 6vw, 64px)',
        }}
      />

      <div style={grid}>
        <div>
          <img
            src={theme.logo}
            alt="Snackle"
            style={{ height: 44, width: 'auto', display: 'block', marginBottom: 16 }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: 1.7,
              color: '#B9B6B2',
              maxWidth: 280,
            }}
          >
            {f.tagline}
          </p>
        </div>

        <div>
          <div style={colTitle}>Explore</div>
          <div className="flex flex-col">
            <a href="#/" style={linkStyle}>
              Home
            </a>
            <a href="#/menu" style={linkStyle}>
              Menu
            </a>
            <a href="#/about" style={linkStyle}>
              About
            </a>
            <a href="#/contact" style={linkStyle}>
              Contact
            </a>
            <a href="#/admin" style={{ ...linkStyle, color: theme.accent }}>
              Admin
            </a>
          </div>
        </div>

        <div>
          <div style={colTitle}>Say hello</div>
          <div className="flex flex-col">
            <a href={`mailto:${f.email}`} style={linkStyle}>
              {f.email}
            </a>
            <a href={`tel:${f.phone.replace(/\s/g, '')}`} style={linkStyle}>
              {f.phone}
            </a>
            <span style={{ ...linkStyle, color: '#B9B6B2', cursor: 'default' }}>{f.location}</span>
          </div>
        </div>

        <div>
          <div style={colTitle}>Follow</div>
          <div className="flex flex-col">
            <a
              href={f.instagram}
              target="_blank"
              rel="noreferrer"
              style={{ ...linkStyle, color: theme.accent }}
            >
              Instagram ↗
            </a>
            <a
              href={f.tiktok}
              target="_blank"
              rel="noreferrer"
              style={{ ...linkStyle, color: theme.accent }}
            >
              TikTok ↗
            </a>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 'clamp(36px, 6vw, 64px)',
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#8E8B87',
          letterSpacing: '0.04em',
        }}
      >
        <span>{f.copyright}</span>
        <span style={{ color: theme.accent, fontWeight: 700, letterSpacing: '0.14em' }}>
          CRAVE · SIP · FLAVOUR
        </span>
      </div>
    </footer>
  );
}
