// Healthy Indian juices and drinks: benefits, cautions and recipes (src/data/drinks.json, built from scripts/drinks).

import raw from '../data/drinks.json';
import { festivalOn } from './festivals';
import type { FamilyProfile, Season } from './types';
import { mondayIndex, seasonFor, toISODate } from './util';

export type DrinkTag =
  | 'Immunity' | 'Hydration' | 'Digestion' | 'Energy' | 'Protein' | 'Calcium' | 'Cooling' | 'Warming'
  | 'Low sugar' | 'Kids' | 'Heart' | 'Eyes & skin' | 'Sleep';

export type DrinkGroup = 'Mixed juices' | 'Juices' | 'Traditional drinks' | 'Cafe' | 'Mocktails';

/** Kinds of mocktail, for the filter in the Mocktails section. */
export type MocktailStyle = 'Mojito' | 'Fizzy' | 'Fruity' | 'Creamy' | 'Spiced';
export const MOCKTAIL_STYLES: MocktailStyle[] = ['Mojito', 'Fizzy', 'Fruity', 'Creamy', 'Spiced'];

/** Kinds of café drink, for the filter in the Coffee section. */
export type CafeStyle = 'Hot coffee' | 'Cold coffee' | 'Tea' | 'Chocolate';
export const CAFE_STYLES: CafeStyle[] = ['Hot coffee', 'Cold coffee', 'Tea', 'Chocolate'];

/** Shown with coffee, tea and chocolate drinks (caffeine limits from ICMR-NIN 2024 and ACOG). */
export const CAFE_NOTE =
  'Coffee and tea have caffeine. Adults: keep to about 300 mg a day in all (2–3 cups of coffee); pregnant women no more than 200 mg. Not for young children. Have tea and coffee at least an hour away from meals so they don’t block iron. These are treats, not health drinks.';

/** Shown with mocktails: they are treats, not health drinks. */
export const MOCKTAIL_NOTE =
  'Mocktails are party treats with no alcohol, not health drinks. Most have added sugar, so enjoy them now and then. Use less syrup, or plain soda instead of sweet soda.';

/** The "What kind?" filter for the two treat sections. */
export const DRINK_STYLES: Partial<Record<DrinkGroup, string[]>> = { Cafe: CAFE_STYLES, Mocktails: MOCKTAIL_STYLES };

/** The note shown with each treat section. */
export const TREAT_NOTES: Partial<Record<DrinkGroup, string>> = { Cafe: CAFE_NOTE, Mocktails: MOCKTAIL_NOTE };

/** Sections of the Drinks screen, in order, with the heading people see. */
export const DRINK_GROUPS: { key: DrinkGroup; label: string; note: string }[] = [
  { key: 'Mixed juices', label: 'Mixed juices', note: 'Fruits and vegetables that work well together' },
  { key: 'Juices', label: 'Fruit and vegetable juices', note: 'One fruit or vegetable, made fresh' },
  { key: 'Traditional drinks', label: 'Traditional drinks', note: 'Chaas, sharbats, milk drinks and home remedies' },
  { key: 'Cafe', label: 'Coffee & café drinks', note: 'Coffees, chai and chocolate drinks, made at home. Treats with caffeine, not health drinks.' },
  { key: 'Mocktails', label: 'Mocktails & mojitos', note: 'Fun party drinks with no alcohol. Treats, not health drinks.' },
];

export interface Drink {
  id: string;
  name: string;
  hindi: string;
  kind: 'Juice' | 'Cooler' | 'Milk drink' | 'Warm drink' | 'Fermented' | 'Water' | 'Mocktail' | 'Café drink';
  /** Mocktails and café drinks only */
  style?: MocktailStyle | CafeStyle;
  /** Café drinks only: served hot (cup) or cold (glass) */
  hot?: boolean;
  /** Café drinks only: how much caffeine, roughly (coffee high, tea medium, cocoa or green tea low) */
  caffeine?: 'High' | 'Medium' | 'Low';
  /** Mocktails and café drinks only: what the drink is like (no health claims) */
  highlights?: string[];
  /** Section on the Drinks screen */
  group: DrinkGroup;
  /** Colour of the drink, for the glass picture */
  color: string;
  tags: DrinkTag[];
  season: Season;
  time: 'Morning' | 'Any time' | 'Evening' | 'Night' | 'After meals' | 'Before meals';
  /** Hands-on time */
  minutes: number;
  /** Extra waiting time, if any (e.g. cold brew steeping overnight) */
  wait?: string;
  serving: string;
  vrat: boolean;
  jain: boolean;
  noOnionGarlic: boolean;
  /** Health benefits; empty for mocktails */
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

export const isMocktail = (d: Drink) => d.group === 'Mocktails';
export const isCafe = (d: Drink) => d.group === 'Cafe';
/** Mocktails and café drinks: treats, shown without health claims. */
export const isTreat = (d: Drink) => isMocktail(d) || isCafe(d);

/** One healthy drink to suggest today (never a mocktail or café drink): in season, keeps the family's rules, and changes every day. */
export function drinkOfTheDay(profile: FamilyProfile, date: Date): Drink | undefined {
  const season = seasonFor(date);
  const fits = DRINKS.filter((d) => !isTreat(d) && drinkFits(d, profile, date));
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
