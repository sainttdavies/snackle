import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { backgroundFor, readable, type SectionConfig } from './config';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const DURATION = '650ms';
const ITEM_TRANSITION = `transform ${DURATION} ${EASE}, filter ${DURATION} ${EASE}, opacity ${DURATION} ${EASE}, left ${DURATION} ${EASE}`;

const GRAIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.08 0"/></filter><rect width="200" height="200" filter="url(%23n)"/></svg>`;

const GRAIN_URL = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)
  .replace(/'/g, '%27')
  .replace(/"/g, '%22')}")`;

type Role = 'center' | 'left' | 'right' | 'back';

export default function CarouselSection({ section }: { section: SectionConfig }) {
  const count = section.images.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const [hovered, setHovered] = useState<'prev' | 'next' | null>(null);
  const lockRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);

  // Preload this section's product art
  useEffect(() => {
    section.images.forEach((image) => {
      if (!image.src) return;
      const preload = new Image();
      preload.src = image.src;
    });
  }, [section.images]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const navigate = useCallback(
    (direction: 'next' | 'prev') => {
      if (lockRef.current || count === 0) return;
      lockRef.current = true;
      setIsAnimating(true);
      setActiveIndex((prev) =>
        direction === 'next' ? (prev + 1) % count : (prev + count - 1) % count,
      );
      timerRef.current = window.setTimeout(() => {
        lockRef.current = false;
        setIsAnimating(false);
      }, 650);
    },
    [count],
  );

  const clampIndex = (i: number) => ((i % count) + count) % count;
  const center = clampIndex(activeIndex);
  const left = clampIndex(activeIndex - 1);
  const right = clampIndex(activeIndex + 1);
  const back = clampIndex(activeIndex + 2);

  const roleOf = (index: number): Role => {
    if (index === center) return 'center';
    if (index === left) return 'left';
    if (index === right) return 'right';
    if (index === back) return 'back';
    return 'back';
  };

  const styleForRole = (role: Role): CSSProperties => {
    if (role === 'center') {
      return {
        transform: `translateX(-50%) scale(${isMobile ? 1.25 : 1.68})`,
        filter: 'blur(0px)',
        opacity: 1,
        zIndex: 20,
        left: '50%',
        height: isMobile ? '60%' : '92%',
        bottom: isMobile ? '22%' : 0,
      };
    }
    if (role === 'back') {
      return {
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(4px)',
        opacity: 1,
        zIndex: 5,
        left: '50%',
        height: isMobile ? '13%' : '22%',
        bottom: isMobile ? '32%' : '12%',
      };
    }
    return {
      transform: 'translateX(-50%) scale(1)',
      filter: 'blur(2px)',
      opacity: 0.85,
      zIndex: 10,
      left: role === 'left' ? (isMobile ? '20%' : '30%') : isMobile ? '80%' : '70%',
      height: isMobile ? '16%' : '28%',
      bottom: isMobile ? '32%' : '12%',
    };
  };

  const bg = backgroundFor(section, activeIndex);
  const ink = readable(bg);
  const hoverFill = ink === '#FFFFFF' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';

  const arrowButton = (which: 'prev' | 'next'): CSSProperties => ({
    backgroundColor: hovered === which ? hoverFill : 'transparent',
    transform: hovered === which ? 'scale(1.08)' : 'scale(1)',
    border: `2px solid ${ink}`,
    color: ink,
    transition: 'transform 150ms, background-color 150ms, border-color 650ms, color 650ms',
  });

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: bg,
        transition: `background-color ${DURATION} ${EASE}`,
        fontFamily: "'Quantico', 'Arial Narrow', sans-serif",
        height: '100svh',
      }}
    >
      {/* 1. Grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 50,
          backgroundImage: GRAIN_URL,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat',
          opacity: 0.4,
        }}
      />

      {/* 2. Giant ghost word */}
      <div
        className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none"
        style={{ zIndex: 2, top: '18%' }}
      >
        <span
          style={{
            fontFamily: "'Quantico', 'Arial Narrow', sans-serif",
            fontSize: 'clamp(90px, 28vw, 380px)',
            fontWeight: 700,
            color: ink,
            opacity: 1,
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            transition: `color ${DURATION} ${EASE}`,
          }}
        >
          {section.ghost}
        </span>
      </div>

      {/* 3. Carousel */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 3 }}
        aria-busy={isAnimating}
        data-animating={isAnimating ? 'true' : 'false'}
      >
        {section.images.map((image, index) => {
          const role = roleOf(index);
          return (
            <div
              key={`${section.id}-${index}-${image.src}`}
              style={{
                position: 'absolute',
                aspectRatio: '0.6 / 1',
                transition: ITEM_TRANSITION,
                willChange: 'transform, filter, opacity',
                ...styleForRole(role),
              }}
            >
              <img
                src={image.src}
                alt={image.alt}
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'bottom center',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 4. Bottom-left copy + nav */}
      <div
        className="absolute bottom-6 left-4 sm:bottom-20 sm:left-24"
        style={{ zIndex: 60, maxWidth: 340 }}
      >
        <p
          className="font-bold uppercase tracking-widest mb-2 sm:mb-3 text-base sm:text-[22px]"
          style={{
            color: ink,
            opacity: 0.95,
            letterSpacing: '0.02em',
            transition: `color ${DURATION} ${EASE}`,
          }}
        >
          {section.title}
        </p>
        <p
          className="hidden sm:block text-xs sm:text-sm mb-4 sm:mb-5"
          style={{
            color: ink,
            opacity: 0.85,
            lineHeight: 1.6,
            transition: `color ${DURATION} ${EASE}`,
          }}
        >
          {section.description}
        </p>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            aria-label={`Previous ${section.title.toLowerCase()}`}
            onClick={() => navigate('prev')}
            onMouseEnter={() => setHovered('prev')}
            onMouseLeave={() => setHovered(null)}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center cursor-pointer"
            style={arrowButton('prev')}
          >
            <ArrowLeft size={26} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            aria-label={`Next ${section.title.toLowerCase()}`}
            onClick={() => navigate('next')}
            onMouseEnter={() => setHovered('next')}
            onMouseLeave={() => setHovered(null)}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center cursor-pointer"
            style={arrowButton('next')}
          >
            <ArrowRight size={26} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      {/* 5. Bottom-right big link */}
      <a
        href="#"
        className="absolute bottom-6 right-4 sm:bottom-20 sm:right-10 flex items-center gap-2 sm:gap-3 no-underline"
        style={{ zIndex: 60, color: ink, transition: `color ${DURATION} ${EASE}` }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.95';
        }}
      >
        <span
          style={{
            fontFamily: "'Quantico', 'Arial Narrow', sans-serif",
            fontSize: 'clamp(20px, 4vw, 56px)',
            fontWeight: 700,
            color: 'inherit',
            opacity: 0.95,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            textTransform: 'uppercase',
            transition: 'opacity 200ms',
          }}
        >
          {section.cta}
        </span>
        <ArrowRight className="w-5 h-5 sm:w-8 sm:h-8" strokeWidth={2.25} />
      </a>
    </div>
  );
}
