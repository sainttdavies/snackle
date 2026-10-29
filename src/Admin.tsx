import { useState } from 'react';
import ImageEditor from './ImageEditor';
import CustomizationEditor from './CustomizationEditor';
import {
  MAX_SECTIONS,
  THEMES,
  addSection,
  applyTheme,
  backgroundFor,
  duplicateSection,
  moveSection,
  readable,
  removeSection,
  type SectionConfig,
  type SiteConfig,
} from './config';

type Props = {
  config: SiteConfig;
  update: (next: SiteConfig) => void;
  reset: () => void;
};

const HEX = /^#[0-9a-fA-F]{6}$/;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" style={{ marginBottom: 16 }}>
      <span
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#6b6f72',
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span style={{ display: 'block', fontSize: 12, color: '#8b9095', marginTop: 4 }}>
          {hint}
        </span>
      )}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 13px',
  fontSize: 15,
  fontFamily: "'Quantico', 'Arial Narrow', sans-serif",
  color: '#2b3033',
  background: '#ffffff',
  border: '1px solid #d9d7d4',
  borderRadius: 8,
  outline: 'none',
};

const btnStyle = (accent: string): React.CSSProperties => ({
  fontFamily: "'Quantico', 'Arial Narrow', sans-serif",
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '12px 20px',
  borderRadius: 8,
  border: `1px solid ${accent}`,
  background: '#ffffff',
  color: '#2b3033',
  cursor: 'pointer',
});

const smallBtn: React.CSSProperties = {
  fontFamily: "'Quantico', 'Arial Narrow', sans-serif",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '7px 12px',
  borderRadius: 7,
  border: '1px solid #d9d7d4',
  background: '#f6f5f4',
  color: '#3a3a3a',
  cursor: 'pointer',
};

export default function Admin({ config, update, reset }: Props) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const theme = THEMES.find((t) => t.id === config.theme) ?? THEMES[0];
  const accent = theme.accent;

  const patchSection = (index: number, patch: Partial<SectionConfig>) =>
    update({
      ...config,
      sections: config.sections.map((section, i) =>
        i === index ? { ...section, ...patch } : section,
      ),
    });

  const patchFooter = (patch: Partial<SiteConfig['footer']>) =>
    update({ ...config, footer: { ...config.footer, ...patch } });

  const patchAbout = (patch: Partial<SiteConfig['about']>) =>
    update({ ...config, about: { ...config.about, ...patch } });

  const colorInput = (value: string, onChange: (v: string) => void) => (
    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#F2703F"
        style={{ ...inputStyle, maxWidth: 160 }}
      />
      {HEX.test(value.trim()) && (
        <input
          type="color"
          value={value.trim()}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Pick colour"
          style={{
            width: 44,
            height: 44,
            padding: 0,
            border: '1px solid #d9d7d4',
            borderRadius: 8,
            background: '#fff',
            cursor: 'pointer',
          }}
        />
      )}
    </span>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F2F1F0',
        fontFamily: "'Quantico', 'Arial Narrow', sans-serif",
        color: '#2b3033',
        padding: '28px clamp(16px, 4vw, 48px) 80px',
      }}
    >
      <div className="admin-reset-row">
        <p>Changes to sections, pages and branding stay in your draft until you publish.</p>
        <div className="admin-reset-actions">
          {confirmingReset ? <>
            <button type="button" style={{...btnStyle(accent),background:'#C9522B',borderColor:'#C9522B',color:'#fff'}} onClick={()=>{reset();setConfirmingReset(false);}}>Confirm reset</button>
            <button type="button" style={btnStyle(accent)} onClick={()=>setConfirmingReset(false)}>Cancel</button>
          </> : <button type="button" style={btnStyle(accent)} onClick={()=>setConfirmingReset(true)}>Reset website draft</button>}
        </div>
      </div>

      {/* Palette */}
      <section style={card}>
        <h2 style={cardTitle}>Brand palette</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {THEMES.map((t) => {
            const active = t.id === config.theme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => update(applyTheme(config, t.id))}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: '#ffffff',
                  border: `2px solid ${active ? t.accent : '#e3e1de'}`,
                  boxShadow: active ? `0 0 0 3px ${t.accent}33` : 'none',
                  fontFamily: "'Quantico', 'Arial Narrow', sans-serif",
                }}
              >
                <img src={t.logo} alt="" style={{ height: 26, width: 'auto' }} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: active ? t.accentDeep : '#6b6f72',
                  }}
                >
                  {t.name}
                </span>
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 12, color: '#8b9095', marginTop: 10 }}>
          Default is orange. Applying a palette resets every section's background to the palette's
          defaults — your text and images are kept.
        </p>
      </section>

      {/* Sections toolbar */}
      <section style={{ ...card, background: '#f6f5f4' }}>
        <div className="flex items-center" style={{ gap: 14, flexWrap: 'wrap' }}>
          <h2 style={{ ...cardTitle, marginBottom: 0 }}>
            Stacked sections ({config.sections.length}/{MAX_SECTIONS})
          </h2>
          <button
            type="button"
            style={{
              ...smallBtn,
              background: accent,
              borderColor: accent,
              color: '#ffffff',
              marginLeft: 'auto',
              opacity: config.sections.length >= MAX_SECTIONS ? 0.5 : 1,
              cursor: config.sections.length >= MAX_SECTIONS ? 'not-allowed' : 'pointer',
            }}
            disabled={config.sections.length >= MAX_SECTIONS}
            onClick={() => update(addSection(config))}
          >
            + Add section
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#8b9095', marginTop: 10, marginBottom: 0 }}>
          Each section is a full-screen carousel that wipes and stacks over the previous one as you
          scroll. Use ↑ ↓ to reorder, Duplicate to clone a section, Delete to remove it.
        </p>
      </section>

      {/* Sections */}
      {config.sections.map((section, sectionIndex) => (
        <section key={section.id} style={card}>
          <div className="flex items-center" style={{ gap: 12, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 999,
                background: '#2b3033',
                color: '#fff',
              }}
            >
              {sectionIndex + 1}
            </span>
            <h2 style={{ ...cardTitle, marginBottom: 0 }}>
              {section.title || section.id}
            </h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                padding: '4px 10px',
                borderRadius: 999,
                background: section.bg,
                color: readable(section.bg),
              }}
            >
              {section.bg}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                style={smallBtn}
                title="Move up"
                disabled={sectionIndex === 0}
                onClick={() => update(moveSection(config, sectionIndex, -1))}
              >
                ↑
              </button>
              <button
                type="button"
                style={smallBtn}
                title="Move down"
                disabled={sectionIndex === config.sections.length - 1}
                onClick={() => update(moveSection(config, sectionIndex, 1))}
              >
                ↓
              </button>
              <button
                type="button"
                style={smallBtn}
                disabled={config.sections.length >= MAX_SECTIONS}
                onClick={() => update(duplicateSection(config, sectionIndex))}
              >
                Duplicate
              </button>
              <button
                type="button"
                style={{ ...smallBtn, color: '#C9522B', borderColor: '#e7c3b7' }}
                disabled={config.sections.length <= 1}
                onClick={() => update(removeSection(config, sectionIndex))}
              >
                Delete
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0 18px',
              marginTop: 16,
            }}
          >
            <Field label="Giant background word" hint="The huge ghost text behind the products">
              <input
                type="text"
                value={section.ghost}
                onChange={(e) => patchSection(sectionIndex, { ghost: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Heading" hint="Bottom-left title">
              <input
                type="text"
                value={section.title}
                onChange={(e) => patchSection(sectionIndex, { title: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Big link label" hint="Bottom-right call to action">
              <input
                type="text"
                value={section.cta}
                onChange={(e) => patchSection(sectionIndex, { cta: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Section background" hint="Base hex colour — drives the rotating shades below">
              {colorInput(section.bg, (v) => patchSection(sectionIndex, { bg: v }))}
            </Field>
            <Field label="Collection label" hint="Top-left label; leave blank to use the carousel default">
              <input value={section.collection ?? ''} onChange={e => patchSection(sectionIndex,{collection:e.target.value})} style={inputStyle}/>
            </Field>
            <Field label="Eyebrow" hint="Small label above the section heading">
              <input value={section.eyebrow ?? ''} onChange={e => patchSection(sectionIndex,{eyebrow:e.target.value})} style={inputStyle}/>
            </Field>
            <Field label="Side note" hint="Vertical message on wider screens">
              <input value={section.note ?? ''} onChange={e => patchSection(sectionIndex,{note:e.target.value})} style={inputStyle}/>
            </Field>
            <Field label="Menu category" hint="The button filters this category; leave blank for all products">
              <input value={section.category ?? ''} onChange={e => patchSection(sectionIndex,{category:e.target.value})} style={inputStyle}/>
            </Field>
            <Field label="Badge text" hint="One line per row; leave blank for the carousel default">
              <textarea value={section.badge ?? ''} onChange={e => patchSection(sectionIndex,{badge:e.target.value})} rows={3} style={inputStyle}/>
            </Field>
            <Field label="Show badge on this section">
              <input type="checkbox" checked={section.badgeVisible !== false} onChange={e => patchSection(sectionIndex,{badgeVisible:e.target.checked})}/>
            </Field>
          </div>

          {/* Rotating background colours used while the carousel spins */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              alignItems: 'center',
              margin: '-4px 0 16px',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#6b6f72',
              }}
            >
              Rotating colours
            </span>
            {section.images.map((_, i) => {
              const colour = backgroundFor(section, i);
              return (
                <span
                  key={`${section.id}-swatch-${i}`}
                  title={`Carousel position ${i + 1}${section.images[i].bg ? ' (pinned)' : ' (auto from section colour)'}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: colour,
                    color: readable(colour),
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  {section.images[i].bg ? '📌 ' : ''}
                  {colour.toUpperCase()}
                </span>
              );
            })}
          </div>

          <Field label="Description" hint="Supporting paragraph under the heading">
            <textarea
              rows={3}
              value={section.description}
              onChange={(e) => patchSection(sectionIndex, { description: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </Field>

          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#6b6f72',
              margin: '6px 0 10px',
            }}
          >
            Carousel images
          </div>

          <ImageEditor images={section.images} onChange={images => patchSection(sectionIndex, {images})} />
          <p style={{ fontSize: 12, color: '#8b9095', marginTop: 8 }}>
            The section background shifts to a different shade on every rotation — see the
            “Rotating colours” row above for exactly which colours appear per position. Leave a
            product's BG empty (auto) to keep inheriting those section shades; type a hex (e.g.
            #6BBF7A) or use the colour picker to pin one colour for that position.
          </p>
        </section>
      ))}

      {/* Footer editor */}
      <section style={card}>
        <h2 style={cardTitle}>Footer</h2>
        <Field label="Tagline">
          <input
            type="text"
            value={config.footer.tagline}
            onChange={(e) => patchFooter({ tagline: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0 18px',
          }}
        >
          <Field label="Email">
            <input
              type="text"
              value={config.footer.email}
              onChange={(e) => patchFooter({ email: e.target.value })}
              style={inputStyle}
            />
          </Field>
          <Field label="Phone">
            <input
              type="text"
              value={config.footer.phone}
              onChange={(e) => patchFooter({ phone: e.target.value })}
              style={inputStyle}
            />
          </Field>
          <Field label="Location">
            <input
              type="text"
              value={config.footer.location}
              onChange={(e) => patchFooter({ location: e.target.value })}
              style={inputStyle}
            />
          </Field>
          <Field label="Copyright line">
            <input
              type="text"
              value={config.footer.copyright}
              onChange={(e) => patchFooter({ copyright: e.target.value })}
              style={inputStyle}
            />
          </Field>
          <Field label="Instagram URL">
            <input
              type="text"
              value={config.footer.instagram}
              onChange={(e) => patchFooter({ instagram: e.target.value })}
              style={inputStyle}
            />
          </Field>
          <Field label="TikTok URL">
            <input
              type="text"
              value={config.footer.tiktok}
              onChange={(e) => patchFooter({ tiktok: e.target.value })}
              style={inputStyle}
            />
          </Field>
        </div>
      </section>

      {/* About editor */}
      <section style={card}>
        <h2 style={cardTitle}>About page</h2>
        <Field label="Title">
          <input
            type="text"
            value={config.about.title}
            onChange={(e) => patchAbout({ title: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label="Story">
          <textarea
            rows={5}
            value={config.about.body}
            onChange={(e) => patchAbout({ body: e.target.value })}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
          />
        </Field>
      </section>

      <CustomizationEditor config={config} update={update}/>

    </div>
  );
}

const card: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e6e4e1',
  borderRadius: 14,
  padding: 'clamp(18px, 3vw, 28px)',
  marginBottom: 20,
  maxWidth: 1040,
};

const cardTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  margin: '0 0 14px',
};
