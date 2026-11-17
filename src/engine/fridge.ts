// "What's in my fridge?": find dishes that use what the family already has.

import { ALL_DISHES, isStaple } from './dishes';
import { mainChoices } from './menu';
import type { Dish, FamilyProfile, MealType, WeekPlan } from './types';

export interface FridgeItem {
  key: string;
  label: string;
  hindi: string;
  /** Exact ingredient names in the dish list (lower case) */
  ingredients: string[];
  /** Words in a dish name that mean it uses this item */
  names: string[];
}

export const FRIDGE_ITEMS: FridgeItem[] = [
  { key: 'paneer', label: 'Paneer', hindi: 'पनीर', ingredients: ['paneer'], names: ['paneer'] },
  { key: 'potato', label: 'Potato', hindi: 'आलू', ingredients: ['potato', 'baby potatoes'], names: ['aloo', 'potato'] },
  { key: 'onion', label: 'Onion', hindi: 'प्याज़', ingredients: ['onion'], names: ['onion'] },
  { key: 'tomato', label: 'Tomato', hindi: 'टमाटर', ingredients: ['tomato'], names: ['tomato', 'tamatar'] },
  { key: 'capsicum', label: 'Capsicum', hindi: 'शिमला मिर्च', ingredients: ['capsicum'], names: ['capsicum'] },
  { key: 'cauliflower', label: 'Cauliflower', hindi: 'फूलगोभी', ingredients: ['cauliflower'], names: ['aloo gobi', 'gobi paratha', 'gobi manchurian'] },
  { key: 'cabbage', label: 'Cabbage', hindi: 'पत्ता गोभी', ingredients: ['cabbage'], names: ['cabbage'] },
  { key: 'carrot', label: 'Carrot', hindi: 'गाजर', ingredients: ['carrot'], names: ['gajar', 'carrot'] },
  { key: 'peas', label: 'Peas', hindi: 'मटर', ingredients: ['peas', 'green peas'], names: ['matar'] },
  { key: 'spinach', label: 'Spinach', hindi: 'पालक', ingredients: ['spinach'], names: ['palak'] },
  { key: 'methi', label: 'Methi', hindi: 'मेथी', ingredients: ['fenugreek leaves'], names: ['methi'] },
  { key: 'bhindi', label: 'Bhindi', hindi: 'भिंडी', ingredients: ['okra'], names: ['bhindi'] },
  { key: 'brinjal', label: 'Brinjal', hindi: 'बैंगन', ingredients: ['brinjal'], names: ['baingan'] },
  { key: 'lauki', label: 'Lauki', hindi: 'लौकी', ingredients: ['bottle gourd'], names: ['lauki'] },
  { key: 'mushroom', label: 'Mushroom', hindi: 'मशरूम', ingredients: ['mushroom'], names: ['mushroom'] },
  { key: 'corn', label: 'Sweet corn', hindi: 'भुट्टा', ingredients: ['sweet corn'], names: ['corn'] },
  { key: 'cucumber', label: 'Cucumber', hindi: 'खीरा', ingredients: ['cucumber'], names: ['cucumber'] },
  { key: 'curd', label: 'Curd', hindi: 'दही', ingredients: ['curd'], names: ['raita', 'kadhi', 'curd'] },
  { key: 'milk', label: 'Milk', hindi: 'दूध', ingredients: ['milk'], names: ['kheer', 'lassi', 'payasam'] },
  { key: 'cheese', label: 'Cheese', hindi: 'चीज़', ingredients: ['cheese', 'mozzarella'], names: ['cheese', 'pizza'] },
  { key: 'rice', label: 'Leftover rice', hindi: 'बचे चावल', ingredients: ['cooked rice'], names: ['fried rice', 'curd rice', 'lemon rice'] },
  { key: 'bread', label: 'Bread or pav', hindi: 'ब्रेड / पाव', ingredients: ['bread', 'pav'], names: ['sandwich', 'toast', ' pav'] },
  { key: 'besan', label: 'Besan', hindi: 'बेसन', ingredients: ['gram flour'], names: ['besan', 'dhokla', 'pakora', 'gatte', 'khandvi'] },
  { key: 'rajma', label: 'Rajma', hindi: 'राजमा', ingredients: ['kidney beans'], names: ['rajma'] },
  { key: 'chana', label: 'Chana', hindi: 'चना', ingredients: ['chickpeas', 'boiled chickpeas', 'black chana'], names: ['chole', 'chana'] },
  { key: 'moong', label: 'Moong dal', hindi: 'मूंग दाल', ingredients: ['moong dal', 'yellow moong dal', 'sprouted moong', 'green moong'], names: ['moong'] },
  { key: 'toor', label: 'Toor dal', hindi: 'तूर दाल', ingredients: ['toor dal'], names: ['sambar', 'dal tadka'] },
  { key: 'poha', label: 'Poha', hindi: 'पोहा', ingredients: ['flattened rice'], names: ['poha'] },
  { key: 'sooji', label: 'Sooji', hindi: 'सूजी', ingredients: ['semolina'], names: ['upma', 'sooji', 'rava'] },
  { key: 'oats', label: 'Oats', hindi: 'ओट्स', ingredients: ['oats'], names: ['oats'] },
  { key: 'soya', label: 'Soya or tofu', hindi: 'सोया / टोफू', ingredients: ['tofu', 'soya chunks', 'soya granules'], names: ['soya', 'tofu'] },
  { key: 'banana', label: 'Banana', hindi: 'केला', ingredients: ['banana', 'raw banana'], names: ['banana'] },
  { key: 'pasta', label: 'Pasta or noodles', hindi: 'पास्ता / नूडल्स', ingredients: ['pasta', 'noodles'], names: ['pasta', 'noodles', 'spaghetti', 'lasagne'] },
];

/** Things nearly every kitchen has; never listed as "also needs". */
const PANTRY = new Set([
  'salt', 'spices', 'oil', 'ghee', 'butter', 'sugar', 'jaggery', 'lemon', 'lime', 'ginger', 'garlic', 'green chilli', 'curry leaves',
  'mustard seeds', 'cumin', 'roasted cumin', 'coriander', 'turmeric', 'pepper', 'amchur', 'ajwain', 'chaat masala', 'tamarind',
  'herbs', 'oregano', 'chilli flakes', 'cardamom', 'saffron', 'honey', 'soy sauce', 'basil', 'dill', 'chutneys', 'chutney', 'wheat flour', 'water',
]);

export interface FridgeMatch {
  dish: Dish;
  /** Labels of the chosen items this dish uses */
  uses: string[];
  /** Other main ingredients it needs (lower case) */
  needs: string[];
}

function itemMatches(item: FridgeItem, dish: Dish): boolean {
  const name = ` ${dish.name.toLowerCase()}`;
  return dish.ingredients.some((i) => item.ingredients.includes(i.toLowerCase())) || item.names.some((w) => name.includes(w));
}

/**
 * Dishes that use the chosen items, most used first, then the fewest other things to buy.
 * Only dishes that keep the family's standing food rules (Jain, no onion-garlic, never suggest).
 */
export function cookFromFridge(have: string[], profile: FamilyProfile, limit = 24): FridgeMatch[] {
  const items = FRIDGE_ITEMS.filter((i) => have.includes(i.key));
  if (!items.length) return [];
  const out: FridgeMatch[] = [];
  for (const dish of ALL_DISHES) {
    if (isStaple(dish) || profile.dislikes.includes(dish.id)) continue;
    if (dish.diet !== 'Veg' || (profile.jain && !dish.jain) || (profile.noOnionGarlic && !dish.noOnionGarlic)) continue;
    const used = items.filter((i) => itemMatches(i, dish));
    if (!used.length) continue;
    const needs = dish.ingredients
      .map((i) => i.toLowerCase())
      .filter((i) => !PANTRY.has(i) && !used.some((u) => u.ingredients.includes(i)));
    out.push({ dish, uses: used.map((u) => u.label), needs });
  }
  return out
    .sort((a, b) => b.uses.length - a.uses.length || a.needs.length - b.needs.length || a.dish.name.localeCompare(b.dish.name))
    .slice(0, limit);
}

/** Meals this week where a dish could go as the main dish (from today on), keeping every hard rule. */
export function placesFor(plan: WeekPlan, profile: FamilyProfile, dishId: string, fromDate: string): { day: number; meal: number; type: MealType; fits: boolean }[] {
  const out: { day: number; meal: number; type: MealType; fits: boolean }[] = [];
  plan.days.forEach((d, day) => {
    if (d.date < fromDate) return;
    d.meals.forEach((m, meal) => {
      const hit = mainChoices(plan, profile, day, meal).find((c) => c.dish.id === dishId);
      if (hit) out.push({ day, meal, type: m.type, fits: hit.fits });
    });
  });
  return out;
}
