// Healthy Indian juices and drinks: benefits, cautions and recipes (src/data/drinks.json, built from scripts/drinks).

import raw from '../data/drinks.json';
import { festivalOn } from './festivals';
import type { FamilyProfile, Season } from './types';
import { mondayIndex, seasonFor, toISODate } from './util';

export type DrinkTag =
  | 'Immunity' | 'Hydration' | 'Digestion' | 'Energy' | 'Protein' | 'Calcium' | 'Cooling' | 'Warming'
  | 'Low sugar' | 'Kids' | 'Heart' | 'Eyes & skin' | 'Sleep';

export type DrinkGroup = 'Mixed juices' | 'Juices' | 'Traditional drinks';

/** Sections of the Drinks screen, in order, with the heading people see. */
export const DRINK_GROUPS: { key: DrinkGroup; label: string; note: string }[] = [
  { key: 'Mixed juices', label: 'Mixed juices', note: 'Fruits and vegetables that work well together' },
  { key: 'Juices', label: 'Fruit and vegetable juices', note: 'One fruit or vegetable, made fresh' },
  { key: 'Traditional drinks', label: 'Traditional drinks', note: 'Chaas, sharbats, milk drinks and home remedies' },
];

export interface Drink {
  id: string;
  name: string;
  hindi: string;
  kind: 'Juice' | 'Cooler' | 'Milk drink' | 'Warm drink' | 'Fermented' | 'Water';
  /** Section on the Drinks screen */
  group: DrinkGroup;
  /** Colour of the drink, for the glass picture */
  color: string;
  tags: DrinkTag[];
  season: Season;
  time: 'Morning' | 'Any time' | 'Evening' | 'Night' | 'After meals' | 'Before meals';
  minutes: number;
  serving: string;
  vrat: boolean;
  jain: boolean;
  noOnionGarlic: boolean;
  benefits: string[];
  nutrients: string[];
  /** Who should be careful, and simple tips */
  caution: string[];
  ingredients: { en: string; hi: string }[];
  steps: { en: string[]; hi: string[] };
}

export const DRINKS = raw as Drink[];

/** Filters shown on the Drinks screen, in this order. */
export const DRINK_TAGS: DrinkTag[] = [
  'Immunity', 'Digestion', 'Hydration', 'Energy', 'Protein', 'Calcium', 'Heart', 'Eyes & skin', 'Low sugar', 'Cooling', 'Warming', 'Kids', 'Sleep',
];

/** Shown with every drink. Drinks support a healthy diet; they don't treat illness. */
export const DRINK_NOTE =
  'These drinks support a healthy diet; they don’t treat or cure illness. Whole fruit has more fibre than juice, so keep fruit juice to one small glass a day. Children under 1 should not have juice. If you are pregnant, have diabetes, kidney disease or high blood pressure, or take regular medicines, ask your doctor before drinking a juice every day. Not medical advice.';

export function getDrink(id: string): Drink | undefined {
  return DRINKS.find((d) => d.id === id);
}

/**
 * Does this drink keep the family's food rules on this date?
 * Jain and no onion-garlic always apply; vrat days (weekly or a festival the family keeps) need vrat drinks.
 */
export function drinkFits(drink: Drink, profile: FamilyProfile, date?: Date): boolean {
  const festival = date ? festivalOn(profile, toISODate(date)) : undefined;
  const jain = profile.jain || festival?.rule === 'jain';
  const noOG = profile.noOnionGarlic || festival?.rule === 'satvik';
  const fast = date ? profile.fastDays.includes(mondayIndex(date)) || festival?.rule === 'vrat' : false;
  if (jain && !drink.jain) return false;
  if (noOG && !drink.noOnionGarlic) return false;
  if (fast && !drink.vrat) return false;
  return true;
}

/** One drink to suggest today: in season, keeps the family's rules, and changes every day. */
export function drinkOfTheDay(profile: FamilyProfile, date: Date): Drink | undefined {
  const season = seasonFor(date);
  const fits = DRINKS.filter((d) => drinkFits(d, profile, date));
  const inSeason = fits.filter((d) => d.season === season || d.season === 'All');
  // Fresh fruit and vegetable juices first; traditional drinks only if no juice fits today.
  const juices = inSeason.filter((d) => d.group !== 'Traditional drinks');
  const pool = juices.length ? juices : inSeason.length ? inSeason : fits;
  if (!pool.length) return undefined;
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 864e5);
  // A fixed shuffle step (coprime with most pool sizes) so neighbouring days don't get similar drinks.
  return pool[(day * 7) % pool.length];
}

/** The drink's recipe in Hindi, for the cook on WhatsApp. */
export function drinkCookMessage(drink: Drink, profile: FamilyProfile): string {
  const greet = profile.cookName.trim() ? `${profile.cookName.trim()} जी, ` : '';
  const lines = [`🥤 *${greet}${drink.hindi}*`, '', '*सामग्री:*', ...drink.ingredients.map((i) => `• ${i.hi}`), '', '*विधि:*'];
  drink.steps.hi.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  if (drink.id === 'lauki-juice') lines.push('', '❗ *लौकी कड़वी हो तो जूस बिल्कुल न बनाएं।*');
  lines.push('', 'धन्यवाद 🙏');
  return lines.join('\n');
}
