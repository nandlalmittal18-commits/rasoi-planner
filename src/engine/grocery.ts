import amountsRaw from '../data/amounts.json';
import { getDish } from './dishes';
import type { FamilyProfile, WeekPlan } from './types';

/** Grams (or ml) of each named ingredient in one adult serving, per dish. Built from scripts/nutrition. */
const AMOUNTS = amountsRaw as Record<string, Record<string, number>>;

/** Sold by volume, so shown in ml / L. */
const LIQUIDS = new Set(['milk', 'buttermilk', 'coconut milk', 'cream']);

export const GROCERY_GROUPS = [
  'Vegetables & herbs',
  'Dals, grains & flours',
  'Dairy',
  'Meat, fish & eggs',
  'Spices, nuts & others',
] as const;
export type GroceryGroup = (typeof GROCERY_GROUPS)[number];

export interface GroceryItem {
  key: string;
  name: string;
  group: GroceryGroup;
  /** Names of the dishes this week that use it */
  dishes: string[];
  /** Rough amount for the week for the whole family, in grams (ml for liquids). Missing for spices, sauces and batters. */
  grams?: number;
  /** The same amount, rounded up and written for a shop: "750 g", "1.5 kg", "500 ml" */
  amount?: string;
}

/** Servings to plan per dish: adults count 1, children about 0.6. */
export function servingsFor(profile: Pick<FamilyProfile, 'adults' | 'kids' | 'hasKids'>): number {
  const adults = profile.adults ?? 2;
  const kids = profile.kids ?? (profile.hasKids ? 1 : 0);
  return Math.max(1, adults + 0.6 * kids);
}

/** Round up to an amount a shop sells, and write it with a unit. */
export function formatAmount(grams: number, liquid = false): string {
  const step = grams < 250 ? 50 : grams < 1000 ? 100 : 250;
  const g = Math.max(step, Math.ceil(grams / step) * step);
  if (g < 1000) return `${g} ${liquid ? 'ml' : 'g'}`;
  const big = (g / 1000).toFixed(2).replace(/\.?0+$/, '');
  return `${big} ${liquid ? 'L' : 'kg'}`;
}

// Checked in order: the first match wins ("coconut milk" is not dairy, "rice flour" is a flour).
const RULES: [RegExp, GroceryGroup][] = [
  [/chicken|mutton|fish|prawn|egg|minced/, 'Meat, fish & eggs'],
  [/coconut|cashew|peanut|poppy|sesame|jaggery|sugar|saffron|tamarind|kokum|amchur|cumin|pepper|spice|masala|sauce|ajwain|fennel|^chilli$|kashmiri|mustard seeds|mustard oil|cardamom|sev|farsan|boondi|chutney|fox nut|roasted|olive oil|paste/, 'Spices, nuts & others'],
  [/paneer|curd|milk|butter|ghee|cream|cheese|khoya|mozzarella|tofu/, 'Dairy'],
  [/dal|rice|flour|semolina|oats|wheat|maida|sago|chickpea|kidney|chana|moong|urad|lentil|black-eyed|moth|batter|noodle|pasta|vermicelli|bread|pav|millet|sattu|soya|gram|pizza base|tortilla|taco|nacho|lasagne|sheets|pita|bun/, 'Dals, grains & flours'],
  [/potato|onion|tomato|cauliflower|cabbage|peas|carrot|beans|okra|gourd|spinach|fenugreek|greens|brinjal|capsicum|cucumber|pumpkin|banana|papaya|drumstick|colocasia|yam|papdi|mushroom|coriander|curry leaves|green chilli|ginger|garlic|lemon|dill|mint|corn|veg|muthia|lettuce|basil|lemongrass|galangal|lime|jalape|sprouts|pineapple|fruit|herbs/, 'Vegetables & herbs'],
];

function groupFor(name: string): GroceryGroup {
  const n = name.toLowerCase();
  for (const [re, group] of RULES) if (re.test(n)) return group;
  return 'Spices, nuts & others';
}

function tidy(name: string): string {
  const n = name.trim().replace(/\s+/g, ' ');
  return n.charAt(0).toUpperCase() + n.slice(1);
}

/** Key ingredients for the whole week, merged and grouped like a shopping list, with rough amounts for `servings` people. */
export function groceryList(plan: WeekPlan, servings = 1): GroceryItem[] {
  const map = new Map<string, GroceryItem>();
  for (const day of plan.days)
    for (const meal of day.meals)
      for (const item of meal.items) {
        const dish = getDish(item.dishId);
        for (const ing of dish.ingredients) {
          const key = ing.toLowerCase().trim();
          const entry = map.get(key) ?? { key, name: tidy(ing), group: groupFor(ing), dishes: [] };
          if (!entry.dishes.includes(dish.name)) entry.dishes.push(dish.name);
          const g = AMOUNTS[dish.id]?.[key];
          if (g) entry.grams = (entry.grams ?? 0) + g * servings;
          map.set(key, entry);
        }
      }
  for (const e of map.values()) if (e.grams) e.amount = formatAmount(e.grams, LIQUIDS.has(e.key));
  const order = (g: GroceryGroup) => GROCERY_GROUPS.indexOf(g);
  return [...map.values()].sort((a, b) => order(a.group) - order(b.group) || a.name.localeCompare(b.name));
}
