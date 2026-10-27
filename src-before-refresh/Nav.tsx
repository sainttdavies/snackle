import { useEffect, useState } from 'react';
import { getTheme, type SiteConfig } from './config';

export const NAV_LINKS = [
  { label: 'HOME', href: '#/' },
  { label: 'MENU', href: '#/menu' },
  { label: 'ABOUT', href: '#/about' },
  { label: 'CONTACT US', href: '#/contact' },
];

type Props = {
  config: SiteConfig;
  /** Ink colour for links/icons — driven by the visible section on the home page */
  ink?: string;
  /** Current route hash for highlighting, e.g. "#/menu" */
  current?: string;
};

export default function Nav({ config, ink = '#1A1C1E', current = '' }: Props) {
  const theme = getTheme(config.theme);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 700);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= 700);
      if (window.innerWidth > 700) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const chamfer = (px: number) =>
    `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, ${px}px 100%, 0 calc(100% - ${px}px))`;

  const linkStyle = (href: string): React.CSSProperties => ({
    fontWeight: 700,
    fontSize: 'clamp(12px, 2.4vw, 15px)',
    letterSpacing: '0.06em',
    color: ink,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    paddingBottom: 4,
    borderBottom: current === href ? `2px solid ${theme.accent}` : '2px solid transparent',
    transition: 'color 650ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms',
  });

  return (
    <header
      className="fixed top-0 left-0 w-full flex items-center"
      style={{
        zIndex: 100,
        gap: 'clamp(20px, 5vw, 56px)',
        padding: 'clamp(14px, 2vw, 22px) clamp(20px, 4vw, 48px)',
        pointerEvents: 'none',
      }}
    >
      <a
        href="#/"
        className="flex items-center"
        style={{ pointerEvents: 'auto', textDecoration: 'none' }}
        aria-label="Snackle home"
      >
        <img
          src={theme.logo}
          alt="Snackle"
          style={{ height: 34, width: 'auto', display: 'block' }}
        />
      </a>

      {!isMobile && (
        <nav className="flex items-center" style={{ gap: 34 }}>
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} style={linkStyle(link.href)}>
              {link.label}
            </a>
          ))}
        </nav>
      )}

      <div
        className="flex items-center"
        style={{ marginLeft: 'auto', gap: 14, pointerEvents: 'auto' }}
      >
        {!isMobile && (
          <a
            href="mailto:hello@snackle.africa"
            className="flex items-center uppercase"
            style={{
              background: 'transparent',
              border: 'none',
              color: ink,
              fontWeight: 700,
              fontSize: 'clamp(11px, 1.6vw, 13px)',
              letterSpacing: '0.14em',
              padding: '13px 24px',
              clipPath: chamfer(12),
              textDecoration: 'none',
              gap: 10,
              transition: 'color 650ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                ink === '#FFFFFF' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="17" height="13" viewBox="0 0 17 13" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="15" height="11" rx="1.5" stroke={ink} strokeWidth="1.4" />
              <path d="M1.5 2 L8.5 7.5 L15.5 2" stroke={ink} strokeWidth="1.4" />
            </svg>
            Contact us
          </a>
        )}

        {!isMobile && (
          <a
            href="#/admin"
            className="flex items-center uppercase"
            style={{
              background: 'transparent',
              border: `1px solid ${ink}`,
              color: ink,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.14em',
              padding: '11px 18px',
              clipPath: chamfer(10),
              textDecoration: 'none',
              transition: 'color 650ms, border-color 650ms',
            }}
          >
            Admin
          </a>
        )}

        {isMobile && (
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex flex-col items-center justify-center cursor-pointer"
            style={{
              width: 44,
              height: 40,
              gap: 5,
              background: 'transparent',
              border: 'none',
              padding: 0,
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 22,
                  height: 2,
                  background: ink,
                  transition: 'background-color 650ms, transform 200ms',
                  transform:
                    menuOpen && i === 1
                      ? 'rotate(45deg)'
                      : menuOpen && i === 0
                        ? 'translateY(7px) rotate(45deg)'
                        : menuOpen && i === 2
                          ? 'translateY(-7px) rotate(-45deg)'
                          : 'none',
                }}
              />
            ))}
          </button>
        )}
      </div>

      {/* Mobile stacked menu */}
      {isMobile && menuOpen && (
        <div
          className="flex flex-col"
          style={{
            position: 'absolute',
            top: '100%',
            left: 12,
            right: 12,
            gap: 18,
            padding: '22px 24px',
            background: 'rgba(242, 241, 240, 0.97)',
            borderRadius: 14,
            boxShadow: '0 24px 60px -30px rgba(0,0,0,0.45)',
            pointerEvents: 'auto',
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: '0.06em',
                color: '#1a1c1e',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#/admin"
            onClick={() => setMenuOpen(false)}
            style={{
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: theme.accentDeep,
              textDecoration: 'none',
            }}
          >
            Admin
          </a>
        </div>
      )}
    </header>
  );
}
