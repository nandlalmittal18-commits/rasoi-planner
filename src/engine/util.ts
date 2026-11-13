import type { Season } from './types';

export type Rng = () => number;

/** Small seeded random generator, so a menu can be reproduced from its seed. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Pick one item; items with a bigger weight are more likely. */
export function weightedPick<T>(items: T[], weight: (item: T) => number, rng: Rng): T | null {
  const weights = items.map((i) => Math.max(0, weight(i)));
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

/** Order items by weighted random draws without replacement (zero-weight items dropped). */
export function weightedOrder<T>(items: T[], weight: (item: T) => number, rng: Rng): T[] {
  const left = items.filter((i) => weight(i) > 0);
  const out: T[] = [];
  while (left.length) {
    const pick = weightedPick(left, weight, rng);
    if (!pick) break;
    out.push(pick);
    left.splice(left.indexOf(pick), 1);
  }
  return out;
}

// ---- Dates (always local time, never UTC, so "today" matches the family's clock) ----

export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/** 0 = Monday … 6 = Sunday */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Indian seasons by month: Nov–Feb winter, Mar–Jun summer, Jul–Oct monsoon. */
export function seasonFor(d: Date): Exclude<Season, 'All'> {
  const m = d.getMonth();
  if (m >= 10 || m <= 1) return 'Winter';
  if (m <= 5) return 'Summer';
  return 'Monsoon';
}

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAYS_HI = ['सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार', 'रविवार'];
