export type ThemeId = 'orange' | 'cream' | 'brown' | 'teal';

export type ProductImage = {
  src: string;
  alt: string;
  /** Optional per-image background. Empty string = derived shade of the section background. */
  bg: string;
};

export type SectionConfig = {
  id: string;
  /** Giant ghost word behind the products */
  ghost: string;
  /** Bottom-left heading, e.g. "SNACKLE JUICES" */
  title: string;
  /** Bottom-left supporting paragraph */
  description: string;
  /** Big bottom-right link, e.g. "ORDER NOW" */
  cta: string;
  /** Section base background colour */
  bg: string;
  images: ProductImage[];
};

export type FooterConfig = {
  tagline: string;
  email: string;
  phone: string;
  location: string;
  instagram: string;
  tiktok: string;
  copyright: string;
};

export type AboutConfig = {
  title: string;
  body: string;
};

export type SiteConfig = {
  theme: ThemeId;
  /** Any number of stacked sections (1–8) */
  sections: SectionConfig[];
  footer: FooterConfig;
  about: AboutConfig;
};

export type Theme = {
  id: ThemeId;
  name: string;
  logo: string;
  accent: string;
  accentHover: string;
  accentDeep: string;
  /** Default backgrounds applied per section index (alternates) when this palette is applied */
  sectionBgs: [string, string];
};

export const THEMES: Theme[] = [
  {
    id: 'orange',
    name: 'Snackle Orange',
    logo: '/logos/snackle-orange.png',
    accent: '#EF6B3E',
    accentHover: '#F58A60',
    accentDeep: '#C9522B',
    sectionBgs: ['#F2703F', '#5E3B2E'],
  },
  {
    id: 'cream',
    name: 'Vanilla Cream',
    logo: '/logos/snackle-cream.png',
    accent: '#EAC98A',
    accentHover: '#F2D9A6',
    accentDeep: '#C9A45C',
    sectionBgs: ['#F7E3BC', '#EFD3A0'],
  },
  {
    id: 'brown',
    name: 'Cocoa Brown',
    logo: '/logos/snackle-brown.png',
    accent: '#6B4536',
    accentHover: '#845A49',
    accentDeep: '#4A2E23',
    sectionBgs: ['#5E3B2E', '#7C5546'],
  },
  {
    id: 'teal',
    name: 'Ocean Teal',
    logo: '/logos/snackle-teal.png',
    accent: '#7BC5BE',
    accentHover: '#96D6D0',
    accentDeep: '#57A9A2',
    sectionBgs: ['#6FBFB7', '#3F8F89'],
  },
];

export const DEFAULT_THEME: ThemeId = 'orange';

export const MAX_SECTIONS = 8;

export const STORAGE_KEY = 'snackle.site.config.v2';

const BASE =
  'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc';
/** Original placeholder art (swap per-product in the admin). */
const PLACEHOLDER_1 = `${BASE}/1.02464a56.png`;
const PLACEHOLDER_2 = `${BASE}/2.b977faab.png`;
const PLACEHOLDER_3 = `${BASE}/3.4df853b4.png`;
const PLACEHOLDER_4 = `${BASE}/4.4457fbce.png`;

const PLACEHOLDERS: ProductImage[] = [
  { src: PLACEHOLDER_1, alt: 'Snackle figurine 1', bg: '' },
  { src: PLACEHOLDER_2, alt: 'Snackle figurine 2', bg: '' },
  { src: PLACEHOLDER_3, alt: 'Snackle figurine 3', bg: '' },
  { src: PLACEHOLDER_4, alt: 'Snackle figurine 4', bg: '' },
];

export function getTheme(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

function placeholderImages(): ProductImage[] {
  return PLACEHOLDERS.map((image) => ({ ...image }));
}

export function newSection(index: number, themeId: ThemeId = DEFAULT_THEME): SectionConfig {
  const theme = getTheme(themeId);
  return {
    id: `section-${Date.now()}-${index}`,
    ghost: 'FRESH SIP',
    title: 'NEW SECTION',
    description:
      'Describe this drop — what is cooking, what is pouring, and why it deserves a full screen.',
    cta: 'SEE MORE',
    bg: theme.sectionBgs[index % 2],
    images: placeholderImages(),
  };
}

export function defaultConfig(): SiteConfig {
  const theme = getTheme(DEFAULT_THEME);
  return {
    theme: DEFAULT_THEME,
    sections: [
      {
        id: 'juices',
        ghost: 'FRESH SIP',
        title: 'SNACKLE JUICES',
        description:
          'Cold-pressed sobolo, mango, pineapple and zobo, blended fresh every morning. Real fruit, no shortcuts — pour, sip, repeat.',
        cta: 'ORDER NOW',
        bg: theme.sectionBgs[0],
        images: placeholderImages(),
      },
      {
        id: 'chops',
        ghost: 'HOT BITES',
        title: 'SMALL CHOPS',
        description:
          'Crispy samosas, golden puff-puff, sausage rolls and spring rolls — fried to order and packed hot. The bite that starts the party.',
        cta: 'GRAB A BITE',
        bg: theme.sectionBgs[1],
        images: placeholderImages(),
      },
    ],
    footer: {
      tagline: 'crave · sip · flavour — fresh juice and hot small chops, made to order.',
      email: 'hello@snackle.africa',
      phone: '+234 801 234 5678',
      location: 'Lagos, Nigeria',
      instagram: 'https://instagram.com/snackle',
      tiktok: 'https://tiktok.com/@snackle',
      copyright: `© ${new Date().getFullYear()} Snackle. All rights reserved.`,
    },
    about: {
      title: 'ABOUT SNACKLE',
      body: 'Snackle is a kitchen-first food brand built on two simple things: juice that is actually fresh and chops that are actually hot. We press, fry and pack everything to order — no freezers, no shortcuts, no waiting around. From a single kitchen to your hands in under thirty minutes, every item carries the same promise: crave it, sip it, taste the flavour.',
    },
  };
}

/* ---------- section CRUD (used by the admin) ---------- */

export function addSection(config: SiteConfig): SiteConfig {
  if (config.sections.length >= MAX_SECTIONS) return config;
  return {
    ...config,
    sections: [...config.sections, newSection(config.sections.length, config.theme)],
  };
}

export function duplicateSection(config: SiteConfig, index: number): SiteConfig {
  if (config.sections.length >= MAX_SECTIONS) return config;
  const source = config.sections[index];
  if (!source) return config;
  const clone: SectionConfig = {
    ...source,
    id: `section-${Date.now()}-${index}`,
    images: source.images.map((image) => ({ ...image })),
  };
  const sections = [...config.sections];
  sections.splice(index + 1, 0, clone);
  return { ...config, sections };
}

export function removeSection(config: SiteConfig, index: number): SiteConfig {
  if (config.sections.length <= 1) return config;
  return { ...config, sections: config.sections.filter((_, i) => i !== index) };
}

export function moveSection(config: SiteConfig, index: number, dir: -1 | 1): SiteConfig {
  const target = index + dir;
  if (target < 0 || target >= config.sections.length) return config;
  const sections = [...config.sections];
  const [moved] = sections.splice(index, 1);
  sections.splice(target, 0, moved);
  return { ...config, sections };
}

/** Applies a palette: keeps copy/images, resets section backgrounds to palette defaults. */
export function applyTheme(config: SiteConfig, themeId: ThemeId): SiteConfig {
  const theme = getTheme(themeId);
  return {
    ...config,
    theme: themeId,
    sections: config.sections.map((section, i) => ({
      ...section,
      bg: theme.sectionBgs[i % 2],
    })),
  };
}

/* ---------- persistence ---------- */

export function loadConfig(): SiteConfig {
  const fallback = defaultConfig();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SiteConfig>;
    const theme: ThemeId = THEMES.some((t) => t.id === parsed.theme)
      ? (parsed.theme as ThemeId)
      : fallback.theme;
    const storedSections = Array.isArray(parsed.sections) ? parsed.sections : [];
    const sections =
      storedSections.length > 0
        ? storedSections.map((stored, i) => {
            const base = fallback.sections[i % fallback.sections.length];
            const images =
              Array.isArray(stored.images) && stored.images.length > 0
                ? stored.images.map((img, j) => ({
                    ...placeholderImages()[j % 4],
                    ...img,
                  }))
                : base.images;
            return { ...base, ...stored, id: stored.id ?? base.id, images };
          })
        : fallback.sections;
    return {
      theme,
      sections,
      footer: { ...fallback.footer, ...(parsed.footer ?? {}) },
      about: { ...fallback.about, ...(parsed.about ?? {}) },
    };
  } catch {
    return fallback;
  }
}

export function saveConfig(config: SiteConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // storage unavailable — config stays in memory for this session
  }
}

/* ---------- colour helpers ---------- */

function parseHex(hex: string): [number, number, number] | null {
  const value = hex.trim().replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    const [r, g, b] = value.split('');
    return [parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16)];
  }
  if (/^[0-9a-fA-F]{6}$/.test(value)) {
    return [
      parseInt(value.slice(0, 2), 16),
      parseInt(value.slice(2, 4), 16),
      parseInt(value.slice(4, 6), 16),
    ];
  }
  return null;
}

/** Picks dark or white ink that reads on the given background. */
export function readable(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return '#FFFFFF';
  const [r, g, b] = rgb;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? '#1A1C1E' : '#FFFFFF';
}

/** Mixes a colour toward white (+) or black (-), used for per-image background tints. */
export function tint(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const mix = (c: number) => {
    const target = amount >= 0 ? 255 : 0;
    const t = Math.abs(amount);
    const v = Math.round(c + (target - c) * t);
    return Math.max(0, Math.min(255, v));
  };
  const [r, g, b] = rgb.map(mix);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Distinct shade per carousel position so the background visibly shifts on rotation. */
const TINT_PATTERN = [0, 0.18, -0.24, 0.1];

export function backgroundFor(section: SectionConfig, imageIndex: number): string {
  const explicit = section.images[imageIndex]?.bg?.trim();
  if (explicit) return explicit;
  return tint(section.bg, TINT_PATTERN[imageIndex % TINT_PATTERN.length]);
}
