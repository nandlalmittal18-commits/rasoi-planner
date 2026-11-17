// Ready-to-send WhatsApp messages: English for the family, Hindi for the cook.

import { getDish } from './dishes';
import { getFestival } from './festivals';
import { groceryForDishes } from './grocery';
import type { PartyMenu } from './menu';
import type { GroceryItem } from './grocery';
import { GROCERY_GROUPS } from './grocery';
import { prepForDay } from './prep';
import type { DayPlan, FamilyProfile, MealType, WeekPlan } from './types';
import { WEEKDAYS, WEEKDAYS_HI, WEEKDAYS_SHORT, parseISODate } from './util';

/** How each meal is named for people (English). */
export const MEAL_NAME: Record<MealType, string> = { Breakfast: 'Breakfast', Lunch: 'Lunch', Snack: 'Evening snack', Dinner: 'Dinner' };
const MEAL_HI: Record<MealType, string> = { Breakfast: 'नाश्ता', Lunch: 'दोपहर का खाना', Snack: 'शाम का नाश्ता', Dinner: 'रात का खाना' };

const RULE_EN = { vrat: 'vrat', satvik: 'satvik, no onion-garlic', jain: 'Jain food' } as const;
const RULE_HI = { vrat: 'व्रत', satvik: 'बिना प्याज़-लहसुन', jain: 'जैन खाना' } as const;

/** A short note for the day: the festival the family keeps, or "Vrat". Empty on ordinary days. */
export function dayNote(day: DayPlan): string {
  const f = day.festival ? getFestival(day.festival) : undefined;
  if (f && day.festivalRule) return day.festivalRule === 'vrat' ? f.name : `${f.name} (${RULE_EN[day.festivalRule]})`;
  return day.isFast ? 'Vrat' : '';
}

function dayNoteHi(day: DayPlan): string {
  const f = day.festival ? getFestival(day.festival) : undefined;
  if (f && day.festivalRule) return `आज ${f.hindi} है (${RULE_HI[day.festivalRule]})`;
  return day.isFast ? 'आज व्रत है' : '';
}

export function formatDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Tomorrow's (or any day's) menu for the family group, in English. */
export function dayMessage(day: DayPlan, profile: FamilyProfile): string {
  const who = profile.familyName.trim() ? `${profile.familyName.trim()} family` : 'Our';
  const lines = [`🍽️ *${who} menu – ${WEEKDAYS[day.weekday]}, ${formatDate(day.date)}*`];
  const note = dayNote(day);
  if (note) lines.push(`🙏 ${note === 'Vrat' ? 'Vrat day' : note}`);
  for (const meal of day.meals) {
    const names = meal.items.map((i) => getDish(i.dishId).name).join(', ');
    lines.push(`*${MEAL_NAME[meal.type]}${meal.tiffin ? ' (tiffin)' : ''}:* ${names}`);
  }
  const prep = prepForDay(day);
  const night = prep.filter((p) => p.when === 'night');
  const morning = prep.filter((p) => p.when === 'morning');
  if (night.length) lines.push('', `⏰ *Night before:* ${night.map((p) => `${p.dish.name} – ${p.note.toLowerCase()}`).join('; ')}`);
  if (morning.length) lines.push(`🌅 *Morning:* ${morning.map((p) => `${p.dish.name} – ${p.note.toLowerCase()}`).join('; ')}`);
  lines.push('', '_Planned with Rasoi Planner_');
  return lines.join('\n');
}

/** The same day in Hindi, written for the cook. */
export function cookMessage(day: DayPlan, profile: FamilyProfile): string {
  const greet = profile.cookName.trim() ? `${profile.cookName.trim()} जी, ` : '';
  const lines = [`🍽️ *${greet}${WEEKDAYS_HI[day.weekday]} (${formatDate(day.date)}) का खाना*`];
  const noteHi = dayNoteHi(day);
  if (noteHi) lines.push(`🙏 ${noteHi}`);
  for (const meal of day.meals) {
    const names = meal.items.map((i) => getDish(i.dishId).hindi).join(', ');
    lines.push(`*${MEAL_HI[meal.type]}${meal.tiffin ? ' (टिफ़िन)' : ''}:* ${names}`);
  }
  const prep = prepForDay(day);
  const night = prep.filter((p) => p.when === 'night');
  const morning = prep.filter((p) => p.when === 'morning');
  if (night.length) lines.push('', `⏰ *रात में ही:* ${night.map((p) => `${p.dish.hindi} – ${p.noteHi}`).join('; ')}`);
  if (morning.length) lines.push(`🌅 *सुबह:* ${morning.map((p) => `${p.dish.hindi} – ${p.noteHi}`).join('; ')}`);
  lines.push('', 'धन्यवाद 🙏');
  return lines.join('\n');
}

/** One cell of the week table: the main dish, and what is served with it. */
export interface WeekCell {
  main: string;
  with: string[];
  tiffin: boolean;
}

/** The week as rows of a table (one per day), with a column for each meal the family plans. */
export interface WeekTable {
  meals: MealType[];
  /** `note` is the festival name or "Vrat"; empty on ordinary days */
  rows: { day: string; isFast: boolean; note: string; cells: (WeekCell | null)[] }[];
}

export function weekTable(plan: WeekPlan): WeekTable {
  const order: MealType[] = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
  const meals = order.filter((t) => plan.days.some((d) => d.meals.some((m) => m.type === t)));
  const rows = plan.days.map((day) => ({
    day: `${WEEKDAYS_SHORT[day.weekday]} ${formatDate(day.date)}`,
    isFast: day.isFast,
    note: dayNote(day),
    cells: meals.map((t): WeekCell | null => {
      const meal = day.meals.find((m) => m.type === t);
      if (!meal?.items.length) return null;
      const main = meal.items.find((i) => i.role !== 'base') ?? meal.items[0];
      return {
        main: getDish(main.dishId).name,
        with: meal.items.filter((i) => i !== main).map((i) => getDish(i.dishId).name),
        tiffin: meal.tiffin,
      };
    }),
  }));
  return { meals, rows };
}

/** Emoji with no variation selector, so they show the same on every phone and on WhatsApp Web. */
const MEAL_EMOJI: Record<MealType, string> = { Breakfast: '🍳', Lunch: '🍛', Snack: '☕', Dinner: '🌙' };

/** The whole week for WhatsApp: one block per day, every meal on its own line. */
export function weekMessage(plan: WeekPlan, profile: FamilyProfile): string {
  const who = profile.familyName.trim() ? `${profile.familyName.trim()} family` : 'Our';
  const table = weekTable(plan);
  const first = table.rows[0]?.day;
  const last = table.rows[table.rows.length - 1]?.day;
  const lines = [`📅 *${who} – week menu*`];
  if (first && last) lines.push(`${first} to ${last}`);
  for (const row of table.rows) {
    lines.push('', `*${row.day}*${row.note ? `  🙏 ${row.note}` : ''}`);
    table.meals.forEach((t, i) => {
      const cell = row.cells[i];
      if (!cell) return;
      const dishes = [cell.main, ...cell.with].join(', ');
      lines.push(`${MEAL_EMOJI[t]} ${MEAL_NAME[t]}: ${dishes}${cell.tiffin ? ' _(tiffin)_' : ''}`);
    });
  }
  lines.push('', '_Planned with Rasoi Planner_');
  return lines.join('\n');
}

export function groceryMessage(items: GroceryItem[], checked: Set<string>): string {
  const lines = ['🛒 *This week’s shopping list*'];
  for (const group of GROCERY_GROUPS) {
    const left = items.filter((i) => i.group === group && !checked.has(i.key));
    if (left.length) lines.push('', `*${group}*`, ...left.map((i) => `• ${i.name}${i.amount ? ` – ${i.amount}` : ''}`));
  }
  return lines.join('\n');
}

export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Guests eat a little less of each dish when there are many dishes. */
export const PARTY_PORTION = 0.7;

/** Shopping for a party menu, for all the guests (family included in the count). */
export function partyShopping(menu: PartyMenu): GroceryItem[] {
  return groceryForDishes(
    menu.courses.map((c) => c.dishId),
    menu.guests * PARTY_PORTION,
  );
}

function partyLines(menu: PartyMenu, name: (id: string) => string): Map<string, string[]> {
  const byLabel = new Map<string, string[]>();
  for (const c of menu.courses) byLabel.set(c.label, [...(byLabel.get(c.label) ?? []), name(c.dishId)]);
  return byLabel;
}

/** The party menu for family and guests, in English. */
export function partyMessage(menu: PartyMenu, profile: FamilyProfile, when?: string): string {
  const who = profile.familyName.trim() ? `${profile.familyName.trim()} family` : 'Our';
  const lines = [`🎉 *${who} – ${menu.meal.toLowerCase()} for ${menu.guests}*${when ? `, ${when}` : ''}`, ''];
  for (const [label, names] of partyLines(menu, (id) => getDish(id).name)) lines.push(`*${label}${names.length > 1 ? 's' : ''}:* ${names.join(', ')}`);
  lines.push('', '_Planned with Rasoi Planner_');
  return lines.join('\n');
}

const COURSE_HI: Record<string, string> = {
  Starter: 'स्टार्टर', Paneer: 'पनीर', Sabzi: 'सब्ज़ी', Dal: 'दाल', Rice: 'चावल', Roti: 'रोटी', 'Raita or salad': 'रायता / सलाद',
  Sweet: 'मीठा', 'Rice dish': 'चावल', 'Curd rice': 'दही चावल', 'Sambar or rasam': 'सांभर / रसम',
};

/** The same party menu in Hindi, for the cook, with the shopping amounts. */
export function partyCookMessage(menu: PartyMenu, profile: FamilyProfile, when?: string): string {
  const greet = profile.cookName.trim() ? `${profile.cookName.trim()} जी, ` : '';
  const meal = menu.meal === 'Lunch' ? 'दोपहर का खाना' : 'रात का खाना';
  const lines = [`🎉 *${greet}${when ? `${when} ` : ''}${menu.guests} लोगों का ${meal}*`, ''];
  for (const [label, names] of partyLines(menu, (id) => getDish(id).hindi)) lines.push(`*${COURSE_HI[label] ?? label}:* ${names.join(', ')}`);
  lines.push('', 'धन्यवाद 🙏');
  return lines.join('\n');
}
