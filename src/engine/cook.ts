// Tomorrow's menu for the cook: as values for the WhatsApp template, and as plain Hindi to read aloud.
// Used by the app ("Listen in Hindi") and by the daily message job on the server (api/cook-daily.js).

import { getDish } from './dishes';
import { getFestival } from './festivals';
import { prepForDay } from './prep';
import type { DayPlan, FamilyProfile, Meal, MealType } from './types';
import { WEEKDAYS_HI, parseISODate } from './util';

const MONTHS_HI = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

/** WhatsApp template values may not contain line breaks, tabs or long runs of spaces, and may not be empty. */
function clean(text: string, max = 180): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return '–';
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function mealHi(meal: Meal | undefined): string {
  return meal?.items.length ? meal.items.map((i) => getDish(i.dishId).hindi).join(', ') : '';
}

function dateHi(day: DayPlan): string {
  const d = parseISODate(day.date);
  const festival = day.festival ? getFestival(day.festival) : undefined;
  const extra = festival ? ` (${festival.hindi})` : day.isFast ? ' (व्रत)' : '';
  return `${WEEKDAYS_HI[day.weekday]}, ${d.getDate()} ${MONTHS_HI[d.getMonth()]}${extra}`;
}

function prepHi(day: DayPlan): string {
  return prepForDay(day)
    .filter((p) => p.when === 'night')
    .map((p) => `${p.dish.hindi} – ${p.noteHi}`)
    .join('; ');
}

const find = (day: DayPlan, t: MealType) => day.meals.find((m) => m.type === t);

/**
 * Values for the approved WhatsApp template "rasoi_kal_ka_khana" (see docs/whatsapp-setup.md), in order:
 * cook's name, date, breakfast, lunch, evening snack, dinner, tonight's prep.
 */
export function cookTemplateParams(day: DayPlan, profile: FamilyProfile): string[] {
  return [
    clean(profile.cookName || 'दीदी', 40),
    clean(dateHi(day), 60),
    clean(mealHi(find(day, 'Breakfast'))),
    clean(mealHi(find(day, 'Lunch'))),
    clean(mealHi(find(day, 'Snack'))),
    clean(mealHi(find(day, 'Dinner'))),
    clean(prepHi(day) || 'कुछ नहीं', 240),
  ];
}

/** The day's menu as plain Hindi sentences, for reading aloud (no symbols or emoji). */
export function cookSpeech(day: DayPlan, profile: FamilyProfile, when: 'आज' | 'कल' | '' = 'कल'): string {
  const name = profile.cookName.trim();
  const parts = [name ? `नमस्ते ${name} जी।` : 'नमस्ते।', `${when ? `${when} ` : ''}${dateHi(day)} का खाना।`];
  const say: [MealType, string][] = [
    ['Breakfast', 'नाश्ते में'],
    ['Lunch', 'दोपहर में'],
    ['Snack', 'शाम को'],
    ['Dinner', 'रात में'],
  ];
  for (const [t, label] of say) {
    const text = mealHi(find(day, t));
    if (text) parts.push(`${label} ${text}।`);
  }
  const prep = prepHi(day);
  if (prep) parts.push(`तैयारी: ${prep}।`);
  parts.push('धन्यवाद।');
  return parts.join(' ').replace(/[*_]/g, '');
}
