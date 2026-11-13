import { getDish } from './dishes';
import type { WeekPlan } from './types';

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

/** Key ingredients for the whole week, merged and grouped like a shopping list. */
export function groceryList(plan: WeekPlan): GroceryItem[] {
  const map = new Map<string, GroceryItem>();
  for (const day of plan.days)
    for (const meal of day.meals)
      for (const item of meal.items) {
        const dish = getDish(item.dishId);
        for (const ing of dish.ingredients) {
          const key = ing.toLowerCase().trim();
          const entry = map.get(key) ?? { key, name: tidy(ing), group: groupFor(ing), dishes: [] };
          if (!entry.dishes.includes(dish.name)) entry.dishes.push(dish.name);
          map.set(key, entry);
        }
      }
  const order = (g: GroceryGroup) => GROCERY_GROUPS.indexOf(g);
  return [...map.values()].sort((a, b) => order(a.group) - order(b.group) || a.name.localeCompare(b.name));
}
