import type { ReactNode } from 'react';
import type { Diet } from '../engine';

type P = { size?: number };
const svg = (size: number, path: ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {path}
  </svg>
);

export const SwapIcon = ({ size = 18 }: P) =>
  svg(size, <><path d="M4 8h13l-3-3" /><path d="M20 16H7l3 3" /></>);
export const CalendarIcon = ({ size = 22 }: P) =>
  svg(size, <><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>);
export const CartIcon = ({ size = 22 }: P) =>
  svg(size, <><path d="M3 4h2.2l2.2 11h10.4l2-8H6.3" /><circle cx="9" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></>);
export const BookIcon = ({ size = 22 }: P) =>
  svg(size, <><path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h10" /></>);
export const FamilyIcon = ({ size = 22 }: P) =>
  svg(size, <><circle cx="8.5" cy="8" r="2.8" /><circle cx="16.5" cy="9.5" r="2.2" /><path d="M3.5 19c.6-3.2 2.6-5 5-5s4.4 1.8 5 5M13.5 19c.4-2.4 1.6-3.7 3-3.7s2.7 1.3 3.2 3.7" /></>);
export const ShuffleIcon = ({ size = 18 }: P) =>
  svg(size, <><path d="M4 7h3.5c4 0 5 10 9 10H20M17 14l3 3-3 3" /><path d="M4 17h3.5c1.4 0 2.4-1.2 3.2-2.7M13.3 9.7C14.1 8.2 15.1 7 16.5 7H20M17 4l3 3-3 3" /></>);
export const MoonIcon = ({ size = 16 }: P) => svg(size, <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />);
export const SunIcon = ({ size = 16 }: P) =>
  svg(size, <><circle cx="12" cy="12" r="3.5" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></>);
export const SunriseIcon = ({ size = 18 }: P) =>
  svg(size, <><path d="M5 17a7 7 0 0 1 14 0" /><path d="M3 20h18M12 4v3M4.9 9.9l1.4 1.4M19.1 9.9l-1.4 1.4" /></>);
export const ChaiIcon = ({ size = 18 }: P) =>
  svg(size, <><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z" /><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3c0 1.5 1.5 1.5 1.5 3M12 3c0 1.5 1.5 1.5 1.5 3" /></>);
export const CopyIcon = ({ size = 18 }: P) =>
  svg(size, <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>);
export const WhatsAppIcon = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.6 21.4l4.8-1.3A9.4 9.4 0 1 0 12 2.5zm0 17.1c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A7.7 7.7 0 1 1 12 19.6zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.3 6.3 0 0 1-3.1-2.7c-.2-.4.2-.4.7-1.2.1-.2 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.2z" />
  </svg>
);

/** The veg / non-veg mark printed on Indian food packs: a dot in a square, or a triangle. */
export function FoodMark({ diet }: { diet: Diet }) {
  const veg = diet === 'Veg';
  const label = veg ? 'Vegetarian' : diet === 'Egg' ? 'Contains egg' : 'Non-vegetarian';
  return (
    <span className={`food-mark ${veg ? 'is-veg' : diet === 'Egg' ? 'is-egg' : 'is-nonveg'}`} role="img" aria-label={label} title={label}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <rect x="1" y="1" width="12" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        {veg ? <circle cx="7" cy="7" r="3" fill="currentColor" /> : <path d="M7 3.6 10.4 9.8H3.6z" fill="currentColor" />}
      </svg>
    </span>
  );
}

export function Logo({ size = 34 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="logo">
      <rect width="40" height="40" rx="11" fill="var(--primary)" />
      <path d="M15 10.5c-1.2 1.4 1.2 2.6 0 4M20 9c-1.2 1.4 1.2 2.6 0 4M25 10.5c-1.2 1.4 1.2 2.6 0 4" stroke="var(--accent)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M8 19h24a12 9 0 0 1-24 0z" fill="var(--accent)" />
      <path d="M6 19h28" stroke="var(--on-primary)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
