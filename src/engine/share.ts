// Ready-to-send WhatsApp messages: English for the family, Hindi for the cook.

import { getDish } from './dishes';
import type { GroceryItem } from './grocery';
import { GROCERY_GROUPS } from './grocery';
import { prepForDay } from './prep';
import type { DayPlan, FamilyProfile, MealType, WeekPlan } from './types';
import { WEEKDAYS, WEEKDAYS_HI, WEEKDAYS_SHORT, parseISODate } from './util';

const MEAL_HI: Record<MealType, string> = { Breakfast: 'नाश्ता', Lunch: 'दोपहर का खाना', Dinner: 'रात का खाना' };

export function formatDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Tomorrow's (or any day's) menu for the family group, in English. */
export function dayMessage(day: DayPlan, profile: FamilyProfile): string {
  const who = profile.familyName.trim() ? `${profile.familyName.trim()} family` : 'Our';
  const lines = [`🍽️ *${who} menu – ${WEEKDAYS[day.weekday]}, ${formatDate(day.date)}*`];
  if (day.isFast) lines.push('🙏 Vrat day');
  for (const meal of day.meals) {
    const names = meal.items.map((i) => getDish(i.dishId).name).join(', ');
    lines.push(`*${meal.type}${meal.tiffin ? ' (tiffin)' : ''}:* ${names}`);
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
  if (day.isFast) lines.push('🙏 आज व्रत है');
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

/** The whole week in one short message. */
export function weekMessage(plan: WeekPlan, profile: FamilyProfile): string {
  const who = profile.familyName.trim() ? `${profile.familyName.trim()} family` : 'This';
  const lines = [`🗓️ *${who} week menu*`];
  for (const day of plan.days) {
    const main = (t: MealType) => {
      const meal = day.meals.find((m) => m.type === t);
      const first = meal?.items.find((i) => i.role !== 'base') ?? meal?.items[0];
      return first ? getDish(first.dishId).name : '–';
    };
    lines.push(`*${WEEKDAYS_SHORT[day.weekday]} ${formatDate(day.date)}${day.isFast ? ' 🙏' : ''}:* ${main('Breakfast')} · ${main('Lunch')} · ${main('Dinner')}`);
  }
  lines.push('', '_Planned with Rasoi Planner_');
  return lines.join('\n');
}

export function groceryMessage(items: GroceryItem[], checked: Set<string>): string {
  const lines = ['🛒 *This week’s shopping list*'];
  for (const group of GROCERY_GROUPS) {
    const left = items.filter((i) => i.group === group && !checked.has(i.key));
    if (left.length) lines.push('', `*${group}*`, ...left.map((i) => `• ${i.name}`));
  }
  return lines.join('\n');
}

export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
