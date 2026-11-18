import { useState } from 'react';
import type { Drink } from '../engine';
import { usePhoto } from '../lib/photos';

/** Lighten a #rrggbb colour towards white (0 = same, 1 = white). */
function tint(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `rgb(${r} ${g} ${b})`;
}

const WARM = new Set(['Warm drink']);
const MILKY = new Set(['Milk drink']);

/** A drawn glass (or cup) in the drink's colour. */
function DrinkArt({ drink, cover }: { drink: Drink; cover: boolean }) {
  const cup = WARM.has(drink.kind) || drink.id === 'haldi-doodh';
  const c = drink.color;
  return (
    <svg className="drink-art" viewBox="0 0 120 120" preserveAspectRatio={cover ? 'xMidYMid slice' : 'xMidYMid meet'} role="img" aria-label={drink.name}>
      <rect width="120" height="120" fill={tint(c, 0.82)} />
      <circle cx="96" cy="22" r="26" fill="#fff" opacity="0.35" />
      <ellipse cx="60" cy="102" rx="34" ry="6" fill="#000" opacity="0.07" />
      {cup ? (
        <g>
          <path d="M30 52h52l-5 40a8 8 0 0 1-8 7H43a8 8 0 0 1-8-7z" fill="#fff" stroke={tint(c, 0.4)} strokeWidth="2" />
          <path d="M33 58h46l-1 6H34z" fill={c} />
          <path d="M82 60c10 0 12 14 0 16" fill="none" stroke={tint(c, 0.4)} strokeWidth="4" strokeLinecap="round" />
          <path d="M48 44c-4-6 4-8 0-14M58 44c-4-6 4-8 0-14M68 44c-4-6 4-8 0-14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
        </g>
      ) : (
        <g>
          <path d="M72 18l-8 22" stroke={drink.kind === 'Water' ? '#ffffff00' : '#1f3a9e'} strokeWidth="4" strokeLinecap="round" />
          <path d="M36 36h48l-6 58a8 8 0 0 1-8 7H50a8 8 0 0 1-8-7z" fill="#ffffffaa" stroke="#ffffff" strokeWidth="2" />
          <path d="M39 50h42l-4.7 44a6 6 0 0 1-6 5.5H49.7a6 6 0 0 1-6-5.5z" fill={c} opacity={MILKY.has(drink.kind) ? 0.95 : 0.9} />
          <path d="M46 56l3 34" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
          {drink.tags.includes('Cooling') && (
            <g fill="#fff" opacity="0.75">
              <rect x="52" y="52" width="9" height="9" rx="2" transform="rotate(12 56 56)" />
              <rect x="64" y="58" width="8" height="8" rx="2" transform="rotate(-10 68 62)" />
            </g>
          )}
          {drink.kind === 'Juice' && <circle cx="84" cy="38" r="9" fill="#9bd36a" stroke="#fff" strokeWidth="2" />}
        </g>
      )}
    </svg>
  );
}

/** Our own photo of the drink when there is one (public/photos/<id>.jpg), otherwise a drawn glass. */
export function DrinkPicture({ drink, className = '', cover = true }: { drink: Drink; className?: string; cover?: boolean }) {
  const photo = usePhoto(drink.id);
  const [failed, setFailed] = useState(false);
  return (
    <span className={`drink-pic ${className}`} style={{ background: tint(drink.color, 0.82) }}>
      <DrinkArt drink={drink} cover={cover} />
      {photo && !failed && <img className="drink-photo" src={photo.src} alt={`Photo of ${drink.name}`} loading="lazy" decoding="async" onError={() => setFailed(true)} />}
    </span>
  );
}
