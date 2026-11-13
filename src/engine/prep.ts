import { getDish } from './dishes';
import type { DayPlan, Dish, MealType } from './types';

export type PrepWhen = 'night' | 'morning';

export interface PrepReminder {
  dish: Dish;
  meal: MealType;
  when: PrepWhen;
  /** English instruction */
  note: string;
  /** Hindi instruction for the cook */
  noteHi: string;
}

/** Hindi for every "Prep Ahead" value in the dish sheet. Add a line here when you add a new one. */
const PREP_HI: Record<string, string> = {
  'Boil potatoes': 'आलू उबाल लें',
  'Boil arbi': 'अरबी उबाल लें',
  'Ferment batter overnight': 'बैटर रात भर खमीर के लिए रखें',
  'Hang curd overnight': 'दही रात भर कपड़े में टांग दें',
  'Marinate 1 hr': '1 घंटा मैरिनेट करें',
  'Marinate 1-2 hrs': '1-2 घंटे मैरिनेट करें',
  'Marinate 2 hrs': '2 घंटे मैरिनेट करें',
  'Marinate 2+ hrs': '2 घंटे से ज़्यादा मैरिनेट करें',
  'Marinate 30 min': '30 मिनट मैरिनेट करें',
  'Rest batter 20 min': 'बैटर 20 मिनट रखें',
  'Salt & rest karela 30 min': 'करेले में नमक लगाकर 30 मिनट रखें',
  'Soak & ferment batter overnight': 'भिगोकर पीसें, रात भर खमीर के लिए रखें',
  'Soak & grind batter, ferment overnight': 'दाल-चावल भिगोकर पीसें, रात भर खमीर के लिए रखें',
  'Soak 6 hrs': '6 घंटे भिगो दें',
  'Soak chana dal 2 hrs': 'चना दाल 2 घंटे भिगो दें',
  'Soak chickpeas overnight; rest dough 2 hrs': 'छोले रात भर भिगो दें; आटा 2 घंटे रखें',
  'Soak dal 1 hr': 'दाल 1 घंटा भिगो दें',
  'Soak dal 4 hrs': 'दाल 4 घंटे भिगो दें',
  'Soak kala chana overnight': 'काले चने रात भर भिगो दें',
  'Soak moong 6 hrs': 'मूंग 6 घंटे भिगो दें',
  'Soak overnight': 'रात भर भिगो दें',
  'Soak poppy seeds 1 hr': 'खसखस 1 घंटा भिगो दें',
  'Soak rice 4 hrs': 'चावल 4 घंटे भिगो दें',
  'Soak sabudana overnight': 'साबूदाना रात भर भिगो दें',
  'Soak urad dal 4 hrs': 'उड़द दाल 4 घंटे भिगो दें',
  'Sprout moong 1-2 days': 'मूंग 1-2 दिन पहले अंकुरित करें',
  'Sprout moth beans 1-2 days': 'मोठ 1-2 दिन पहले अंकुरित करें',
  'Use leftover rice': 'एक दिन पहले थोड़ा ज़्यादा चावल बना लें',
};

/**
 * When does this prep step have to happen? null = it is part of normal cooking
 * (boiling potatoes, resting batter) and needs no reminder.
 */
export function prepTiming(dish: Dish, meal: MealType): PrepWhen | null {
  const p = dish.prepAhead?.toLowerCase();
  if (!p) return null;
  if (p.includes('leftover')) return 'night';
  if (/overnight|days|ferment|hang/.test(p)) return 'night';
  const hours = Number(p.match(/(\d+)\s*hr/)?.[1] ?? 0);
  if (p.includes('soak')) return meal === 'Breakfast' || hours >= 4 ? 'night' : 'morning';
  if (p.includes('marinate')) return meal === 'Breakfast' ? 'night' : 'morning';
  return null;
}

/** Reminders for one day's dishes: what to do the night before and in the morning. */
export function prepForDay(day: DayPlan): PrepReminder[] {
  const out: PrepReminder[] = [];
  for (const meal of day.meals) {
    for (const item of meal.items) {
      const dish = getDish(item.dishId);
      const when = prepTiming(dish, meal.type);
      if (!when || !dish.prepAhead) continue;
      const leftover = dish.prepAhead.toLowerCase().includes('leftover');
      out.push({
        dish,
        meal: meal.type,
        when,
        note: leftover ? 'Cook extra rice the day before' : dish.prepAhead,
        noteHi: PREP_HI[dish.prepAhead] ?? dish.prepAhead,
      });
    }
  }
  return out;
}
