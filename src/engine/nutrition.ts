// Approximate nutrition for one standard home serving of each dish.
// Worked out by `python3 scripts/build_nutrition.py` from scripts/nutrition/*.psv
// (ingredient values per 100 g + grams used per serving). Not medical advice.
import raw from '../data/nutrition.json';
import type { Meal, DayPlan } from './types';

export interface Nutrition {
  /** What one serving means, e.g. "1 katori" or "2 phulkas" */
  serving: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

export type NutritionTotals = Omit<Nutrition, 'serving'>;

const NUTRITION = raw as Record<string, Nutrition>;

/** A dish with at least this much protein (g per serving) is "High protein". */
export const HIGH_PROTEIN = 12;
/** A dish with at least this much protein (g per serving) is a "Good protein" source. */
export const GOOD_PROTEIN = 8;

export const NUTRITION_NOTE =
  'Approximate values for one home serving, worked out from standard food composition data. Not medical advice.';

export function getNutrition(dishId: string): Nutrition | null {
  return NUTRITION[dishId] ?? null;
}

export function proteinLevel(dishId: string): 'high' | 'good' | null {
  const protein = NUTRITION[dishId]?.protein ?? 0;
  if (protein >= HIGH_PROTEIN) return 'high';
  if (protein >= GOOD_PROTEIN) return 'good';
  return null;
}

/** Light: a small, low-fat serving. Rich: lots of fat or calories. */
export function richness(dishId: string): 'light' | 'rich' | null {
  const n = NUTRITION[dishId];
  if (!n) return null;
  if (n.fat >= 20 || n.kcal >= 550) return 'rich';
  if (n.kcal <= 200 && n.fat <= 8) return 'light';
  return null;
}

function add(dishIds: string[]): NutritionTotals {
  const t: NutritionTotals = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };
  for (const id of dishIds) {
    const n = NUTRITION[id];
    if (!n) continue;
    t.kcal += n.kcal;
    t.protein += n.protein;
    t.carbs += n.carbs;
    t.fat += n.fat;
    t.fibre += n.fibre;
  }
  return {
    kcal: Math.round(t.kcal),
    protein: Math.round(t.protein),
    carbs: Math.round(t.carbs),
    fat: Math.round(t.fat),
    fibre: Math.round(t.fibre),
  };
}

/** One serving of every dish in the meal, for one person. */
export function mealNutrition(meal: Meal): NutritionTotals {
  return add(meal.items.map((i) => i.dishId));
}

/** One serving of every dish across the day's meals, for one person. */
export function dayNutrition(day: DayPlan): NutritionTotals {
  return add(day.meals.flatMap((m) => m.items.map((i) => i.dishId)));
}

/**
 * Daily protein guide for adults, from ICMR-NIN 2020 (0.83 g per kg body weight a day):
 * about 46 g for the reference woman (55 kg) and 54 g for the reference man (65 kg).
 */
export const PROTEIN_GUIDE = { low: 46, high: 54 } as const;

export interface DayProtein {
  date: string;
  weekday: number;
  protein: number;
  kcal: number;
}

/** Protein and calories per day for one person (one serving of each dish), for the week's card. */
export function weekProtein(plan: { days: DayPlan[] }): { days: DayProtein[]; average: number } {
  const days = plan.days.map((d) => {
    const t = dayNutrition(d);
    return { date: d.date, weekday: d.weekday, protein: t.protein, kcal: t.kcal };
  });
  const average = days.length ? Math.round(days.reduce((a, d) => a + d.protein, 0) / days.length) : 0;
  return { days, average };
}
