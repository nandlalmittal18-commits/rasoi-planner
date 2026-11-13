// Short recipes (English and Hindi) for every dish.
// Written in scripts/recipes/*.json; merged and checked by `python3 scripts/build_recipes.py`.
import raw from '../data/recipes.json';
import type { Dish } from './types';

export interface Recipe {
  en: string[];
  hi: string[];
}

const RECIPES = raw as Record<string, Recipe>;

export function getRecipe(dishId: string): Recipe | null {
  return RECIPES[dishId] ?? null;
}

/** A recipe ready to send on WhatsApp: Hindi for the cook, English for family. */
export function recipeMessage(dish: Dish, lang: 'en' | 'hi'): string {
  const recipe = getRecipe(dish.id);
  const title = lang === 'hi' ? `🍳 *${dish.hindi} बनाने का तरीका*` : `🍳 *How to make ${dish.name}*`;
  const steps = (recipe?.[lang] ?? []).map((s, i) => `${i + 1}. ${s}`);
  const prep = dish.prepAhead ? [lang === 'hi' ? '⏰ पहले से तैयारी ज़रूरी है' : `⏰ Prep ahead: ${dish.prepAhead}`] : [];
  return [title, ...prep, '', ...steps, '', '_Rasoi Planner_'].join('\n');
}
