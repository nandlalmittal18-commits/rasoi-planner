// The menu engine: turns a FamilyProfile into a balanced 7-day menu.
//
// How it decides, in plain words:
//  1. Hard rules are never broken: diet, non-veg days, Jain, no onion-garlic,
//     vrat days and dishes the family dislikes.
//  2. Soft rules are kept when possible and relaxed one by one only if nothing
//     fits, in this order: in-season only, then weekday cooking time, then
//     no dish twice in a week, and last tiffin-friendly lunch and at most one
//     heavy dish a day.
//  3. Among the dishes that fit, preferred cuisines, kid favourites,
//     seasonal dishes and (with "Protein focus" on) protein-rich dishes
//     are more likely to be picked.
//  4. World food (Chinese, Italian, Continental…) appears only on the
//     family's chosen number of "world-food dinners", plus the odd
//     continental breakfast, and never on vrat days.

import { proteinLevel } from './nutrition';
import { ALL_DISHES, cuisineOf, getDish, hasDish, isRiceStaple, isStaple, isWorldCuisine, isWorldDish } from './dishes';
import type { DayPlan, Dish, FamilyProfile, Meal, MealItem, MealType, RoleKey, Season, WeekPlan } from './types';
import {
  addDays,
  makeRng,
  mondayIndex,
  parseISODate,
  seasonFor,
  toISODate,
  weightedOrder,
  weightedPick,
  type Rng,
} from './util';

export const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

/** The meals planned each day for this family, in the order they are eaten. */
export function mealsFor(profile: FamilyProfile): MealType[] {
  return MEAL_TYPES.filter((m) => m !== 'Snack' || profile.eveningSnack);
}

interface Ctx {
  profile: FamilyProfile;
  meal: MealType;
  isWeekend: boolean;
  isFast: boolean;
  nonVegAllowed: boolean;
  season: Season;
  tiffin: boolean;
  /** Non-staple dishes already planned this week */
  used: Set<string>;
  /** A heavy dish is already planned today (including earlier in this meal) */
  dayHeavy: boolean;
  /** dayHeavy before this meal started */
  heavyBeforeMeal: boolean;
  /** Dishes already in this meal */
  inMeal: Set<string>;
}

// ---------------------------------------------------------------- roles

const ROLE_MATCH: Record<Exclude<RoleKey, 'base'>, (d: Dish, meal: MealType) => boolean> = {
  breakfast: (d) =>
    d.slots.includes('Breakfast') && ['Breakfast', 'Paneer', 'Snack'].includes(d.category),
  dal: (d, m) => d.category === 'Dal / Legume' && d.slots.includes(m),
  sabzi: (d, m) => d.category.startsWith('Sabzi') && d.slots.includes(m),
  paneer: (d, m) => d.category === 'Paneer' && d.slots.includes(m),
  nonveg: (d, m) => d.category === 'Non-Veg Main' && d.slots.includes(m) && !isWorldDish(d),
  riceDish: (d, m) =>
    (d.category === 'One-Pot Meal' || (d.category === 'Rice' && !isRiceStaple(d))) && d.slots.includes(m) && !isWorldDish(d),
  combo: (d, m) => d.category === 'Combo Meal' && d.slots.includes(m),
  lightDinner: (d) => d.category === 'Breakfast' && d.slots.includes('Dinner'),
  snack: (d) => d.slots.includes('Snack') && !isWorldDish(d) && d.category !== 'Non-Veg Main',
  side: (d) => d.category === 'Side',
  vratBreakfast: (d) => d.vrat && (d.slots.includes('Breakfast') || d.category === 'Snack'),
  vratMain: (d) => d.vrat && (d.category === 'Breakfast' || d.category === 'Rice'),
  vratSide: (d) => d.vrat && d.category.startsWith('Sabzi'),
  vratExtra: (d) => d.vrat && (d.category === 'Snack' || d.category === 'Sweet'),
  vratSnack: (d) => d.vrat && (d.slots.includes('Snack') || d.category === 'Snack' || d.category === 'Sweet'),
  worldMain: (d, m) =>
    isWorldDish(d) && d.slots.includes(m) && ['World Main', 'Rice', 'One-Pot Meal', 'Non-Veg Main'].includes(d.category),
  worldSide: (d) => d.category === 'World Side',
  any: (d, m) => (d.slots.includes(m) || d.vrat) && d.category !== 'Bread' && d.category !== 'Side',
};

// ---------------------------------------------------------------- templates

interface RoleSlot {
  role: RoleKey;
  optional?: boolean;
}
interface Template {
  key: string;
  label: string;
  roles: RoleSlot[];
  weight: (c: Ctx) => number;
}

const r = (role: RoleKey, optional = false): RoleSlot => ({ role, optional });
const prefers = (c: Ctx, g: string) => c.profile.cuisines.includes(g as never);
const canNonVeg = (c: Ctx) => c.profile.diet !== 'Veg' && c.nonVegAllowed && !c.isFast;

const TEMPLATES: Record<MealType, Template[]> = {
  Breakfast: [{ key: 'breakfast', label: 'Breakfast', roles: [r('breakfast')], weight: () => 1 }],
  Lunch: [
    { key: 'thali', label: 'Dal, sabzi & roti/rice', roles: [r('dal'), r('sabzi'), r('base')], weight: () => 4 },
    { key: 'rice-meal', label: 'Rice meal', roles: [r('riceDish'), r('side', true)], weight: (c) => (prefers(c, 'South') ? 2.5 : 1.2) },
    { key: 'nonveg', label: 'Non-veg meal', roles: [r('nonveg'), r('base'), r('side', true)], weight: (c) => (canNonVeg(c) ? (c.profile.diet === 'Egg' ? 1 : 3) : 0) },
    { key: 'paneer', label: 'Paneer meal', roles: [r('paneer'), r('dal'), r('base')], weight: () => 0.8 },
    { key: 'combo', label: 'Weekend special', roles: [r('combo'), r('side', true)], weight: (c) => (c.isWeekend ? 1.5 : 0) },
  ],
  Dinner: [
    { key: 'dinner-thali', label: 'Dal, sabzi & roti', roles: [r('dal'), r('sabzi'), r('base')], weight: () => 2 },
    { key: 'sabzi-roti', label: 'Sabzi & roti', roles: [r('sabzi'), r('base')], weight: () => 2 },
    { key: 'paneer', label: 'Paneer & roti', roles: [r('paneer'), r('base')], weight: (c) => (c.profile.hasKids ? 2 : 1.3) },
    { key: 'nonveg', label: 'Non-veg dinner', roles: [r('nonveg'), r('base')], weight: (c) => (canNonVeg(c) ? (c.profile.diet === 'Egg' ? 1 : 3) : 0) },
    { key: 'one-pot', label: 'One-pot dinner', roles: [r('riceDish'), r('side', true)], weight: () => 1.5 },
    { key: 'light', label: 'Light dinner', roles: [r('lightDinner')], weight: (c) => (prefers(c, 'South') ? 2 : 0.6) },
    { key: 'combo', label: 'Weekend special', roles: [r('combo')], weight: (c) => (c.isWeekend ? 1 : 0) },
  ],
  Snack: [{ key: 'snack', label: 'Chai time', roles: [r('snack')], weight: () => 1 }],
};

const FAST_TEMPLATES: Record<MealType, Template[]> = {
  Breakfast: [{ key: 'vrat-breakfast', label: 'Vrat breakfast', roles: [r('vratBreakfast')], weight: () => 1 }],
  Lunch: [
    { key: 'vrat-meal', label: 'Vrat meal', roles: [r('vratMain'), r('vratSide', true)], weight: () => 1 },
    { key: 'vrat-light', label: 'Vrat meal', roles: [r('vratSide'), r('vratExtra')], weight: () => 0.01 },
  ],
  Dinner: [
    { key: 'vrat-meal', label: 'Vrat meal', roles: [r('vratMain'), r('vratSide', true)], weight: () => 1 },
    { key: 'vrat-light', label: 'Vrat meal', roles: [r('vratSide'), r('vratExtra')], weight: () => 0.01 },
  ],
  Snack: [{ key: 'vrat-snack', label: 'Vrat snack', roles: [r('vratSnack')], weight: () => 1 }],
};

/** Used only on the family's world-food nights. The side always matches the main's cuisine. */
const WORLD_TEMPLATE: Template = {
  key: 'world',
  label: 'World food night',
  roles: [r('worldMain'), r('worldSide', true)],
  weight: () => 1,
};

const PROTEIN_ROLES: RoleKey[] = ['dal', 'paneer', 'nonveg'];

/** With "Protein focus" on, meal patterns that include a dal, paneer or non-veg dish come up more often. */
function proteinPatternBoost(t: Template, c: Ctx): number {
  if (!c.profile.proteinFocus) return 1;
  return t.roles.some((slot) => PROTEIN_ROLES.includes(slot.role)) ? 2 : 0.5;
}

/** Last resort when no pattern fits (very strict profiles). */
const FALLBACK: Template = { key: 'simple', label: 'Simple meal', roles: [r('any')], weight: () => 1 };

// ---------------------------------------------------------------- filters & weights

/**
 * Can this dish be served here?
 * level 0 = all rules; 1 = ignore season; 2 = also ignore weekday cooking time;
 * 3 = also allow weekly repeats; 4 = also ignore tiffin and heaviness.
 * Hard rules never relax.
 */
const MAX_LEVEL = 4;

function passes(d: Dish, c: Ctx, level: number): boolean {
  const p = c.profile;
  if (p.dislikes.includes(d.id) || c.inMeal.has(d.id)) return false;
  if (d.diet === 'Egg' && !(p.diet !== 'Veg' && c.nonVegAllowed)) return false;
  if (d.diet === 'Non-Veg' && !(p.diet === 'Non-Veg' && c.nonVegAllowed)) return false;
  if (p.jain && !d.jain) return false;
  if (p.noOnionGarlic && !d.noOnionGarlic) return false;
  if (c.isFast && !d.vrat) return false;
  if ((p.worldMealsPerWeek ?? 1) === 0 && isWorldDish(d)) return false;

  if (level < 1 && d.season !== 'All' && d.season !== c.season) return false;
  if (level < 2 && !c.isWeekend && d.cookTime > p.weekdayMaxCookTime) return false;
  if (level < 3 && !isStaple(d) && c.used.has(d.id)) return false;
  if (level < 4) {
    if (c.tiffin && !d.tiffin) return false;
    // No heavy breakfast or evening snack on weekdays, and at most one heavy dish a day.
    if (d.heaviness === 'Heavy' && (c.dayHeavy || ((c.meal === 'Breakfast' || c.meal === 'Snack') && !c.isWeekend))) return false;
  }
  return true;
}

function weight(d: Dish, c: Ctx): number {
  let w = 1;
  const group = cuisineOf(d);
  const prefs = c.profile.cuisines;
  if (isWorldCuisine(group)) {
    const worldPrefs = prefs.filter(isWorldCuisine);
    w *= worldPrefs.length ? (worldPrefs.includes(group) ? 3 : 0.1) : 0.4;
  } else {
    const indianPrefs = prefs.filter((g) => !isWorldCuisine(g));
    if (indianPrefs.length) w *= group === null ? 1.5 : indianPrefs.includes(group) ? 3 : 0.25;
  }
  if (d.season !== 'All' && d.season === c.season) w *= 1.6;
  if (c.profile.hasKids && d.kidFavourite) w *= 1.5;
  if (c.profile.proteinFocus) {
    // Soft preference only: hard rules (diet, vrat, Jain…) are checked before this.
    const level = proteinLevel(d.id);
    w *= level === 'high' ? 3 : level === 'good' ? 1.8 : 1;
  }
  if (c.isWeekend && (d.heaviness === 'Heavy' || d.difficulty === 'Hard')) w *= 1.8;
  if (!c.isWeekend && d.difficulty === 'Hard') w *= 0.4;
  if (c.meal === 'Dinner' && d.heaviness === 'Heavy') w *= 0.4;
  // Weekday evening snacks should be quick to make.
  if (c.meal === 'Snack' && !c.isWeekend && d.cookTime > 20) w *= 0.4;
  return w;
}

function pickForRole(
  role: Exclude<RoleKey, 'base'>,
  c: Ctx,
  rng: Rng,
  exclude?: Set<string>,
  maxLevel = MAX_LEVEL,
  extra?: (d: Dish) => boolean,
): Dish | null {
  for (let level = 0; level <= maxLevel; level++) {
    const pool = ALL_DISHES.filter(
      (d) => ROLE_MATCH[role](d, c.meal) && !exclude?.has(d.id) && (!extra || extra(d)) && passes(d, c, level),
    );
    const pick = weightedPick(pool, (d) => weight(d, c), rng);
    if (pick) return pick;
  }
  return null;
}

// ---------------------------------------------------------------- roti / rice

const RICE_WORDS = /rice|chawal|khichdi/;
const ROTI_WORDS = /roti|naan|kulcha|puri|paratha|bhakri|rotli|pav|parotta|toast|any/;

function baseKind(main: Dish, c: Ctx, rng: Rng): 'rice' | 'roti' | 'both' {
  const text = main.pairsWith.join(' ').toLowerCase();
  const rice = RICE_WORDS.test(text);
  const roti = ROTI_WORDS.test(text);
  if (rice && !roti) return 'rice';
  if (roti && !rice) return 'roti';
  const cu = c.profile.cuisines;
  const riceFirst = cu.some((g) => g === 'South' || g === 'East') && !cu.some((g) => g === 'North' || g === 'West');
  if (c.meal === 'Lunch') return riceFirst ? 'rice' : rng() < 0.5 ? 'both' : 'roti';
  return riceFirst && rng() < 0.5 ? 'rice' : 'roti';
}

function breadWeight(d: Dish, c: Ctx): number {
  const cu = c.profile.cuisines;
  switch (d.id) {
    case 'phulka-roti':
      return 6;
    case 'plain-paratha':
      return c.isWeekend ? 2 : 0.5;
    case 'makki-ki-roti':
    case 'bajra-roti':
    case 'missi-roti':
      return cu.includes('North') ? 1.2 : 0.3;
    case 'jowar-bhakri':
      return cu.includes('West') ? 1.5 : 0.3;
    case 'ragi-mudde':
      return cu.includes('South') ? 1 : 0.1;
    default:
      return 0.5;
  }
}

function pickBread(c: Ctx, rng: Rng, exclude?: Set<string>): Dish | null {
  for (const level of [0, MAX_LEVEL]) {
    const pool = ALL_DISHES.filter(
      (d) => d.category === 'Bread' && d.slots.includes(c.meal) && !exclude?.has(d.id) && passes(d, c, level),
    );
    const pick = weightedPick(pool, (d) => breadWeight(d, c), rng);
    if (pick) return pick;
  }
  return null;
}

function pickRice(c: Ctx, rng: Rng, exclude?: Set<string>): Dish | null {
  for (const level of [0, MAX_LEVEL]) {
    const pool = ALL_DISHES.filter((d) => isRiceStaple(d) && !exclude?.has(d.id) && passes(d, c, level));
    const pick = weightedPick(pool, (d) => (d.id === 'steamed-rice' ? 5 : c.isWeekend ? 2 : 1), rng);
    if (pick) return pick;
  }
  return null;
}

function pickBases(main: Dish, c: Ctx, rng: Rng): Dish[] {
  const kind = baseKind(main, c, rng);
  const out: Dish[] = [];
  if (kind !== 'rice') {
    const bread = pickBread(c, rng);
    if (bread) out.push(bread);
  }
  if (kind !== 'roti') {
    const rice = pickRice(c, rng);
    if (rice) out.push(rice);
  }
  if (!out.length) {
    const any = pickBread(c, rng) ?? pickRice(c, rng);
    if (any) out.push(any);
  }
  return out;
}

// ---------------------------------------------------------------- meals & days

function fillTemplate(t: Template, c: Ctx, rng: Rng, maxLevel: number): MealItem[] | null {
  c.inMeal = new Set();
  c.dayHeavy = c.heavyBeforeMeal;
  const items: MealItem[] = [];
  const chosen: Dish[] = [];
  for (const { role, optional } of t.roles) {
    if (role === 'base') {
      if (!chosen[0]) return null;
      for (const b of pickBases(chosen[0], c, rng)) {
        items.push({ dishId: b.id, role: 'base' });
        c.inMeal.add(b.id);
      }
      continue;
    }
    if (optional && rng() < 0.4) continue;
    const extra = role === 'worldSide' && chosen[0] ? sameCuisine(chosen[0]) : undefined;
    const d = pickForRole(role, c, rng, undefined, maxLevel, extra);
    if (!d) {
      if (optional) continue;
      return null;
    }
    items.push({ dishId: d.id, role });
    chosen.push(d);
    c.inMeal.add(d.id);
    if (d.heaviness === 'Heavy') c.dayHeavy = true;
  }
  return items.length ? items : null;
}

const sameCuisine = (main: Dish) => (d: Dish) => cuisineOf(d) === cuisineOf(main);

function buildMeal(c: Ctx, rng: Rng, world = false): Meal {
  if (world && c.meal === 'Dinner' && !c.isFast) {
    for (let maxLevel = 0; maxLevel <= MAX_LEVEL; maxLevel++) {
      const items = fillTemplate(WORLD_TEMPLATE, c, rng, maxLevel);
      if (items) return { type: c.meal, label: WORLD_TEMPLATE.label, tiffin: false, items };
    }
  }
  const templates = (c.isFast ? FAST_TEMPLATES : TEMPLATES)[c.meal];
  const order = [...weightedOrder(templates, (t) => t.weight(c) * proteinPatternBoost(t, c), rng), FALLBACK];
  // Try every meal pattern with all rules first; relax rules only if no pattern fits.
  for (let maxLevel = 0; maxLevel <= MAX_LEVEL; maxLevel++) {
    for (const t of order) {
      const items = fillTemplate(t, c, rng, maxLevel);
      if (items) return { type: c.meal, label: c.tiffin ? `${t.label} · tiffin` : t.label, tiffin: c.tiffin, items };
    }
  }
  return { type: c.meal, label: 'No dish fits these rules', tiffin: c.tiffin, items: [] };
}

function dayFlags(profile: FamilyProfile, date: Date) {
  const weekday = mondayIndex(date);
  const isFast = profile.fastDays.includes(weekday);
  return {
    weekday,
    isWeekend: weekday >= 5,
    isFast,
    nonVegAllowed: profile.diet !== 'Veg' && profile.nonVegDays.includes(weekday) && !isFast,
    season: seasonFor(date),
  };
}

function makeCtx(profile: FamilyProfile, day: DayPlan, meal: MealType, used: Set<string>, dayHeavy: boolean): Ctx {
  const f = dayFlags(profile, parseISODate(day.date));
  return {
    profile,
    meal,
    isWeekend: f.isWeekend,
    isFast: f.isFast,
    nonVegAllowed: f.nonVegAllowed,
    season: f.season,
    tiffin: profile.packsTiffin && meal === 'Lunch' && !f.isWeekend && !f.isFast,
    used,
    dayHeavy,
    heavyBeforeMeal: dayHeavy,
    inMeal: new Set(),
  };
}

function isHeavyMeal(m: Meal): boolean {
  return m.items.some((i) => i.role !== 'base' && getDish(i.dishId).heaviness === 'Heavy');
}

function rememberMeal(m: Meal, used: Set<string>) {
  for (const i of m.items) if (!isStaple(getDish(i.dishId))) used.add(i.dishId);
}

function buildDay(profile: FamilyProfile, date: Date, used: Set<string>, rng: Rng, worldDinner = false): DayPlan {
  const f = dayFlags(profile, date);
  const day: DayPlan = {
    date: toISODate(date),
    weekday: f.weekday,
    isFast: f.isFast,
    nonVegAllowed: f.nonVegAllowed,
    meals: [],
  };
  let dayHeavy = false;
  for (const meal of mealsFor(profile)) {
    const m = buildMeal(makeCtx(profile, day, meal, used, dayHeavy), rng, worldDinner && meal === 'Dinner');
    rememberMeal(m, used);
    dayHeavy ||= isHeavyMeal(m);
    day.meals.push(m);
  }
  day.worldDinner = day.meals.some((m) => m.type === 'Dinner' && m.items.some((i) => i.role === 'worldMain'));
  return day;
}

// ---------------------------------------------------------------- public API

/** Make a 7-day menu starting on `start` (local date). */
export function generateWeek(profile: FamilyProfile, start: Date, seed: number): WeekPlan {
  const rng = makeRng(seed);
  const used = new Set<string>();
  // Pick which evenings are world-food nights: never a vrat day, weekends a little more likely.
  const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const open = dates.map((_, i) => i).filter((i) => !profile.fastDays.includes(mondayIndex(dates[i])));
  const worldNights = new Set(
    weightedOrder(open, (i) => (mondayIndex(dates[i]) >= 5 ? 2 : 1), rng).slice(0, Math.max(0, profile.worldMealsPerWeek ?? 1)),
  );
  const days = dates.map((date, i) => buildDay(profile, date, used, rng, worldNights.has(i)));
  return { startDate: toISODate(start), createdAt: new Date().toISOString(), days };
}

function usedExcept(plan: WeekPlan, skip: (d: number, m: number, i: number) => boolean): Set<string> {
  const used = new Set<string>();
  plan.days.forEach((day, d) =>
    day.meals.forEach((meal, m) =>
      meal.items.forEach((item, i) => {
        if (!skip(d, m, i) && !isStaple(getDish(item.dishId))) used.add(item.dishId);
      }),
    ),
  );
  return used;
}

/** Replace one whole day with fresh choices that still fit the rest of the week. */
export function regenerateDay(plan: WeekPlan, profile: FamilyProfile, dayIndex: number, seed: number): WeekPlan {
  const used = usedExcept(plan, (d) => d === dayIndex);
  const next = structuredClone(plan);
  const world = plan.days[dayIndex].worldDinner ?? false;
  next.days[dayIndex] = buildDay(profile, parseISODate(plan.days[dayIndex].date), used, makeRng(seed), world);
  return next;
}

/**
 * Swap one dish for another that does the same job (another dal for a dal, etc.).
 * Swapping the main dish also re-picks roti/rice to match it.
 * Returns the same plan object if nothing else fits.
 */
export function swapItem(
  plan: WeekPlan,
  profile: FamilyProfile,
  dayIndex: number,
  mealIndex: number,
  itemIndex: number,
  seed: number,
): WeekPlan {
  const rng = makeRng(seed);
  const day = plan.days[dayIndex];
  const meal = day.meals[mealIndex];
  const item = meal.items[itemIndex];
  const used = usedExcept(plan, (d, m, i) => d === dayIndex && m === mealIndex && i === itemIndex);
  const dayHeavy = day.meals.some((m, i) => i !== mealIndex && isHeavyMeal(m));
  const c = makeCtx(profile, day, meal.type, used, dayHeavy);
  c.inMeal = new Set(meal.items.filter((_, i) => i !== itemIndex).map((i) => i.dishId));
  const exclude = new Set([item.dishId]);

  const next = structuredClone(plan);
  const items = next.days[dayIndex].meals[mealIndex].items;

  if (item.role === 'base') {
    const current = getDish(item.dishId);
    const alt = current.category === 'Bread' ? pickBread(c, rng, exclude) : pickRice(c, rng, exclude);
    if (!alt) return plan;
    items[itemIndex] = { dishId: alt.id, role: 'base' };
    return next;
  }

  const main = meal.items.find((i) => i.role === 'worldMain');
  const extra = item.role === 'worldSide' && main ? sameCuisine(getDish(main.dishId)) : undefined;
  const alt = pickForRole(item.role, c, rng, exclude, MAX_LEVEL, extra);
  if (!alt) return plan;
  items[itemIndex] = { dishId: alt.id, role: item.role };

  // A new world main needs a soup or side from the same cuisine.
  if (item.role === 'worldMain') {
    const sideIndex = items.findIndex((i) => i.role === 'worldSide');
    if (sideIndex >= 0 && cuisineOf(getDish(items[sideIndex].dishId)) !== cuisineOf(alt)) {
      c.inMeal = new Set([alt.id]);
      const side = pickForRole('worldSide', c, rng, undefined, MAX_LEVEL, sameCuisine(alt));
      if (side) items[sideIndex] = { dishId: side.id, role: 'worldSide' };
      else items.splice(sideIndex, 1);
    }
  }

  // If the main dish changed, pick roti/rice that suits the new one.
  const mainIndex = items.findIndex((i) => i.role !== 'base');
  const hasBase = items.some((i) => i.role === 'base');
  if (itemIndex === mainIndex && hasBase) {
    c.inMeal = new Set(items.filter((i) => i.role !== 'base').map((i) => i.dishId));
    const bases = pickBases(alt, c, rng).map((b): MealItem => ({ dishId: b.id, role: 'base' }));
    const firstBase = items.findIndex((i) => i.role === 'base');
    const others = items.filter((i) => i.role !== 'base');
    others.splice(Math.min(firstBase, others.length), 0, ...bases);
    next.days[dayIndex].meals[mealIndex].items = others;
  }
  return next;
}

/** False when a saved menu mentions a dish that no longer exists (renamed or removed). */
export function isPlanUsable(plan: WeekPlan | null | undefined): plan is WeekPlan {
  return !!plan?.days?.length && plan.days.every((d) => d.meals.every((m) => m.items.every((i) => hasDish(i.dishId))));
}

/** Every dish in a meal, resolved. */
export function mealDishes(meal: Meal): Dish[] {
  return meal.items.map((i) => getDish(i.dishId));
}
