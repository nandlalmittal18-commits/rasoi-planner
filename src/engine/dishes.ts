import raw from '../data/dishes.json';
import type { CuisineGroup, Dish, WorldCuisine } from './types';

/** The 153 dishes from the dish sheet. Regenerate with `python3 scripts/build_dishes.py`. */
export const DISHES: Dish[] = raw as unknown as Dish[];

/** Plain rice is a staple, not a "dish", so it lives here instead of the sheet. */
export const STEAMED_RICE: Dish = {
  id: 'steamed-rice',
  name: 'Steamed Rice',
  hindi: 'चावल',
  slots: ['Lunch', 'Dinner'],
  category: 'Rice',
  diet: 'Veg',
  region: 'Pan-India',
  cookTime: 20,
  difficulty: 'Easy',
  ingredients: ['Rice'],
  jain: true,
  noOnionGarlic: true,
  vrat: false,
  tiffin: true,
  kidFavourite: true,
  season: 'All',
  heaviness: 'Light',
  prepAhead: null,
  pairsWith: [],
};

export const ALL_DISHES: Dish[] = [...DISHES, STEAMED_RICE];

const byId = new Map(ALL_DISHES.map((d) => [d.id, d]));

export function hasDish(id: string): boolean {
  return byId.has(id);
}

export function getDish(id: string): Dish {
  const dish = byId.get(id);
  if (!dish) throw new Error(`Unknown dish id: ${id}`);
  return dish;
}

/** Staples can repeat every day (roti, rice, raita…). Everything else appears once a week. */
const STAPLE_IDS = new Set(['steamed-rice', 'jeera-rice']);
export function isStaple(d: Dish): boolean {
  return STAPLE_IDS.has(d.id) || d.category === 'Bread' || d.category === 'Side';
}
export function isRiceStaple(d: Dish): boolean {
  return STAPLE_IDS.has(d.id);
}

/** Which cuisine group each region in the sheet belongs to. null = everyday / pan-Indian. */
export const REGION_GROUP: Record<string, CuisineGroup | null> = {
  North: 'North',
  Punjab: 'North',
  Kashmir: 'North',
  Rajasthan: 'North',
  Sindhi: 'North',
  Gujarat: 'West',
  Maharashtra: 'West',
  Goa: 'West',
  South: 'South',
  'Tamil Nadu': 'South',
  Karnataka: 'South',
  Kerala: 'South',
  'Andhra Pradesh': 'South',
  Telangana: 'South',
  Coastal: 'South',
  'West Bengal': 'East',
  Odisha: 'East',
  Bihar: 'East',
  'North-East': 'East',
  'Pan-India': null,
  Modern: null,
  'Indo-Chinese': 'Chinese',
  Italian: 'Italian',
  Continental: 'Continental',
  Mexican: 'Mexican',
  Thai: 'Thai',
  'Middle Eastern': 'Middle Eastern',
};

export const WORLD_CUISINES: WorldCuisine[] = ['Chinese', 'Italian', 'Continental', 'Mexican', 'Thai', 'Middle Eastern'];

export function isWorldCuisine(g: CuisineGroup | null | undefined): g is WorldCuisine {
  return !!g && (WORLD_CUISINES as string[]).includes(g);
}

/** Chinese, Italian, Continental… (anything not Indian home food) */
export function isWorldDish(d: Dish): boolean {
  return isWorldCuisine(REGION_GROUP[d.region]);
}

export function cuisineOf(d: Dish): CuisineGroup | null {
  return REGION_GROUP[d.region] ?? null;
}
