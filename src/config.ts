import customization from '../shared/customization.json';
export type Customization = typeof customization;
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

export type SiteConfig = Customization & {
  theme: ThemeId;
  /** Any number of stacked sections (1–8) */
  sections: SectionConfig[];
  footer: FooterConfig;
  about: AboutConfig;
  /** Single-owner entry slug, exposed publicly for the /admin entry point. */
  entryKey?: string;
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


const PLACEHOLDERS: ProductImage[] = [
  { src: '/images/snackle-juices.png', alt: 'Snackle mango, sobolo and pineapple juices', bg: '' },
  { src: '/products/juice-sobolo.svg', alt: 'Signature sobolo', bg: '' },
  { src: '/products/juice-mango.svg', alt: 'Mango sunshine', bg: '' },
  { src: '/products/juice-pineapple.svg', alt: 'Pineapple crush', bg: '' },
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
    ...structuredClone(customization),
    theme: DEFAULT_THEME,
    sections: [
      {
        id: 'juices',
        ghost: 'FRESH SIP',
        title: 'Fresh sips. Big smiles.',
        description:
          'Bold sobolo. Sunny mango. Tropical pineapple. Find your favourite feel-good sip.',
        cta: 'Find your sip',
        bg: theme.sectionBgs[0],
        images: placeholderImages(),
      },
      {
        id: 'chops',
        ghost: 'HOT BITES',
        title: 'Little bites. Big love.',
        description:
          'Golden samosas, crispy spring rolls and fluffy puff-puff. The little things that make every gathering delicious.',
        cta: 'Grab a bite',
        bg: theme.sectionBgs[1],
        images: [{src:'/images/snackle-bites.png',alt:'A platter of Snackle small chops',bg:''},{src:'/products/snack-samosa.svg',alt:'Golden samosas',bg:''},{src:'/products/snack-spring-roll.svg',alt:'Crispy spring rolls',bg:''},{src:'/products/snack-puff.svg',alt:'Golden puff-puff',bg:''}],
      },
    ],
    footer: {
      tagline: 'crave · sip · savour — fresh juice and hot small chops, made to order.',
      email: 'cindyafidoku0@gmail.com',
      phone: '',
      location: 'Accra, Ghana',
      instagram: '',
      tiktok: '',
      copyright: `© ${new Date().getFullYear()} Snackle. All rights reserved.`,
    },
    about: {
      title: 'Life needs\nmore good bites.',
      body: 'Snackle is all about the little things that bring people together: a crispy bite, a refreshing sip, and something delicious to share. From golden small chops to sobolo, mango and pineapple drinks, we bring big flavour to everyday cravings and special celebrations. Pick your favourites, gather your people, and make it a Snackle moment.',
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

export function hydrateConfig(value: Partial<SiteConfig>): SiteConfig {
  const base=defaultConfig();
  const merged={...base,...value};
  for(const group of Object.keys(customization) as (keyof Customization)[]) Object.assign(merged,{[group]:{...base[group],...value[group]}});
  return merged;
}
