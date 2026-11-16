import { describe, expect, it } from 'vitest';
import {
  DISHES,
  getRecipe,
  MEAL_NAME,
  getNutrition,
  dayNutrition,
  proteinLevel,
  weekProtein,
  recipeMessage,
  cuisineOf,
  isWorldDish,
  cookMessage,
  dayMessage,
  generateWeek,
  getDish,
  groceryList,
  isStaple,
  prepForDay,
  regenerateDay,
  swapItem,
  type FamilyProfile,
  type WeekPlan,
} from './index';

const START = new Date(2026, 10, 16); // Monday 16 Nov 2026 (winter)

const base: FamilyProfile = {
  familyName: 'Test',
  diet: 'Veg',
  nonVegDays: [],
  jain: false,
  noOnionGarlic: false,
  fastDays: [],
  cuisines: ['North', 'West'],
  worldMealsPerWeek: 2,
  hasKids: true,
  eveningSnack: true,
  proteinFocus: false,
  packsTiffin: true,
  weekdayMaxCookTime: 45,
  dislikes: [],
  cookName: '',
};

/** With the evening snack on, meals are Breakfast, Lunch, Snack, Dinner. */
const DINNER = 3;

function everyItem(plan: WeekPlan) {
  return plan.days.flatMap((day) =>
    day.meals.flatMap((meal) => meal.items.map((item) => ({ day, meal, item, dish: getDish(item.dishId) }))),
  );
}

describe('dish data', () => {
  it('has 192 dishes with unique, plain ids and Hindi names', () => {
    expect(DISHES).toHaveLength(192);
    expect(new Set(DISHES.map((d) => d.id)).size).toBe(192);
    expect(DISHES.every((d) => /^[a-z0-9-]+$/.test(d.id))).toBe(true);
    expect(DISHES.every((d) => d.hindi.length > 0)).toBe(true);
  });
});

describe('recipes', () => {
  it('every dish, and plain rice, has a recipe in English and Hindi with matching steps', () => {
    for (const d of [...DISHES, getDish('steamed-rice')]) {
      const r = getRecipe(d.id);
      expect(r, d.name).not.toBeNull();
      expect(r!.en.length, d.name).toBeGreaterThanOrEqual(3);
      expect(r!.hi.length, d.name).toBe(r!.en.length);
    }
  });

  it('builds a Hindi recipe message for the cook', () => {
    const msg = recipeMessage(getDish('rajma'), 'hi');
    expect(msg).toContain('राजमा बनाने का तरीका');
    expect(msg).toContain('1. ');
  });
});

describe('generateWeek', () => {
  it('fills 7 days × 4 meals (with evening snack) for the default family', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const plan = generateWeek(base, START, seed);
      expect(plan.days).toHaveLength(7);
      for (const day of plan.days) {
        expect(day.meals.map((m) => m.type)).toEqual(['Breakfast', 'Lunch', 'Snack', 'Dinner']);
        for (const meal of day.meals) expect(meal.items.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps every soft rule for a typical family', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const plan = generateWeek(base, START, seed);
      const items = everyItem(plan);
      // no dish twice in the week (roti, rice and raita may repeat)
      const repeats = items.filter((x) => !isStaple(x.dish)).map((x) => x.dish.id);
      expect(new Set(repeats).size, `seed ${seed}`).toBe(repeats.length);
      for (const { day, meal, dish } of items) {
        const weekend = day.weekday >= 5;
        if (!weekend) expect(dish.cookTime, `${dish.name} seed ${seed}`).toBeLessThanOrEqual(45);
        if (meal.tiffin) expect(dish.tiffin, `${dish.name} in tiffin`).toBe(true);
        expect(['All', 'Winter']).toContain(dish.season);
      }
      for (const day of plan.days) {
        const heavy = day.meals.flatMap((m) => m.items.filter((i) => i.role !== 'base').map((i) => getDish(i.dishId))).filter((d) => d.heaviness === 'Heavy');
        expect(heavy.length, `heavy dishes on ${day.date} seed ${seed}`).toBeLessThanOrEqual(1);
      }
      // weekday lunches are packed
      expect(plan.days.filter((d) => d.weekday < 5).every((d) => d.meals[1].tiffin)).toBe(true);
    }
  });

  it('never breaks hard rules, whatever the profile', () => {
    const diets = ['Veg', 'Egg', 'Non-Veg'] as const;
    let checked = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const r = (n: number) => (seed * 2654435761 + n * 97) % 1000 / 1000;
      const profile: FamilyProfile = {
        ...base,
        diet: diets[seed % 3],
        nonVegDays: [0, 1, 2, 3, 4, 5, 6].filter((_, i) => r(i) > 0.5),
        jain: r(10) > 0.8,
        noOnionGarlic: r(11) > 0.8,
        fastDays: r(12) > 0.6 ? [Math.floor(r(13) * 7)] : [],
        cuisines: (['North', 'West', 'South', 'East', 'Chinese', 'Italian', 'Thai'] as const).filter((_, i) => r(20 + i) > 0.5),
        worldMealsPerWeek: Math.floor(r(40) * 5),
        hasKids: r(30) > 0.5,
        proteinFocus: r(33) > 0.5,
        packsTiffin: r(31) > 0.5,
        weekdayMaxCookTime: [30, 45, 60][Math.floor(r(32) * 3)],
        dislikes: ['poha', 'rajma', 'aloo-gobi'],
      };
      const plan = generateWeek(profile, START, seed);
      for (const { day, meal, dish } of everyItem(plan)) {
        checked++;
        expect(profile.dislikes).not.toContain(dish.id);
        if (profile.diet === 'Veg') expect(dish.diet).toBe('Veg');
        if (profile.diet === 'Egg') expect(dish.diet).not.toBe('Non-Veg');
        if (dish.diet !== 'Veg') expect(profile.nonVegDays).toContain(day.weekday);
        if (profile.jain) expect(dish.jain, dish.name).toBe(true);
        if (profile.noOnionGarlic) expect(dish.noOnionGarlic, dish.name).toBe(true);
        if (day.isFast) expect(dish.vrat, `${dish.name} on vrat day`).toBe(true);
        if (profile.worldMealsPerWeek === 0) expect(isWorldDish(dish), `${dish.name} for an Indian-only family`).toBe(false);
        expect(meal.items.length).toBeGreaterThan(0);
      }
    }
    expect(checked).toBeGreaterThan(3000);
  });

  it('is a fully vegetarian app: every dish is veg, whatever an old saved profile says', () => {
    expect(DISHES.every((d) => d.diet === 'Veg')).toBe(true);
    const old: FamilyProfile = { ...base, diet: 'Non-Veg', nonVegDays: [0, 1, 2, 3, 4, 5, 6] };
    for (let seed = 1; seed <= 10; seed++) {
      for (const { dish } of everyItem(generateWeek(old, START, seed))) expect(dish.diet, dish.name).toBe('Veg');
    }
  });

  it('plans only vrat food on fasting days', () => {
    const profile: FamilyProfile = { ...base, fastDays: [1] };
    const plan = generateWeek(profile, START, 3);
    const tuesday = plan.days.find((d) => d.weekday === 1)!;
    expect(tuesday.isFast).toBe(true);
    for (const meal of tuesday.meals) for (const i of meal.items) expect(getDish(i.dishId).vrat).toBe(true);
  });
});

describe('world-food nights', () => {
  const lover: FamilyProfile = { ...base, cuisines: ['North', 'Italian', 'Chinese'], worldMealsPerWeek: 3, fastDays: [1] };

  it('plans exactly the chosen number of world dinners, never on vrat days', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const plan = generateWeek(lover, START, seed);
      const nights = plan.days.filter((d) => d.worldDinner);
      expect(nights.length, `seed ${seed}`).toBe(3);
      expect(nights.every((d) => !d.isFast)).toBe(true);
      for (const day of plan.days) {
        const dinner = day.meals[DINNER];
        const main = dinner.items.find((i) => i.role === 'worldMain');
        if (!day.worldDinner) {
          expect(main).toBeUndefined();
          continue;
        }
        const mainDish = getDish(main!.dishId);
        expect(isWorldDish(mainDish)).toBe(true);
        for (const side of dinner.items.filter((i) => i.role === 'worldSide'))
          expect(cuisineOf(getDish(side.dishId)), `${getDish(side.dishId).name} with ${mainDish.name}`).toBe(cuisineOf(mainDish));
      }
    }
  });

  it('mostly picks the cuisines the family likes', () => {
    let liked = 0;
    let total = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const plan = generateWeek(lover, START, seed);
      for (const d of plan.days.filter((x) => x.worldDinner)) {
        total++;
        const g = cuisineOf(getDish(d.meals[DINNER].items[0].dishId));
        if (g === 'Italian' || g === 'Chinese') liked++;
      }
    }
    expect(liked / total).toBeGreaterThan(0.85);
  });

  it('keeps lunch and other dinners Indian', () => {
    const plan = generateWeek(lover, START, 9);
    for (const day of plan.days)
      for (const meal of day.meals.slice(1))
        if (!(meal.type === 'Dinner' && day.worldDinner))
          for (const i of meal.items) expect(isWorldDish(getDish(i.dishId)), getDish(i.dishId).name).toBe(false);
  });

  it('swapping a world main keeps the soup or side in the same cuisine', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const plan = generateWeek(lover, START, seed);
      const d = plan.days.findIndex((x) => x.worldDinner && x.meals[DINNER].items.some((i) => i.role === 'worldSide'));
      if (d < 0) continue;
      const next = swapItem(plan, lover, d, DINNER, 0, seed * 7);
      const items = next.days[d].meals[DINNER].items;
      const main = getDish(items[0].dishId);
      expect(isWorldDish(main)).toBe(true);
      for (const s of items.filter((i) => i.role === 'worldSide')) expect(cuisineOf(getDish(s.dishId))).toBe(cuisineOf(main));
    }
  });
});

describe('swapItem and regenerateDay', () => {
  it('swaps a dish for another of the same role that still fits', () => {
    const plan = generateWeek(base, START, 11);
    const lunch = plan.days[0].meals[1];
    const idx = lunch.items.findIndex((i) => i.role !== 'base');
    const before = lunch.items[idx];
    const next = swapItem(plan, base, 0, 1, idx, 99);
    const after = next.days[0].meals[1].items.find((i) => i.role === before.role)!;
    expect(after.dishId).not.toBe(before.dishId);
    const others = everyItem(next).filter((x) => !isStaple(x.dish)).map((x) => x.dish.id);
    expect(new Set(others).size).toBe(others.length);
    expect(plan.days[0].meals[1].items[idx].dishId).toBe(before.dishId); // original untouched
  });

  it('can swap roti for another bread', () => {
    const plan = generateWeek(base, START, 5);
    for (const [d, day] of plan.days.entries())
      for (const [m, meal] of day.meals.entries())
        for (const [i, item] of meal.items.entries())
          if (item.role === 'base' && getDish(item.dishId).category === 'Bread') {
            const next = swapItem(plan, base, d, m, i, 1);
            expect(getDish(next.days[d].meals[m].items[i].dishId).category).toBe('Bread');
            expect(next.days[d].meals[m].items[i].dishId).not.toBe(item.dishId);
            return;
          }
  });

  it('regenerates one day without touching the others', () => {
    const plan = generateWeek(base, START, 21);
    const next = regenerateDay(plan, base, 3, 1234);
    expect(next.days[2]).toEqual(plan.days[2]);
    expect(next.days[3]).not.toEqual(plan.days[3]);
  });
});

describe('prep, grocery and messages', () => {
  it('reminds to soak rajma the night before', () => {
    const plan = generateWeek(base, START, 1);
    plan.days[0].meals[1].items = [
      { dishId: 'rajma', role: 'dal' },
      { dishId: 'steamed-rice', role: 'base' },
    ];
    const prep = prepForDay(plan.days[0]).filter((p) => p.dish.id === 'rajma');
    expect(prep).toEqual([expect.objectContaining({ when: 'night', noteHi: 'रात भर भिगो दें' })]);
    expect(dayMessage(plan.days[0], base)).toContain('Night before');
    expect(cookMessage({ ...plan.days[0] }, { ...base, cookName: 'Sunita' })).toContain('Sunita जी');
    expect(cookMessage(plan.days[0], base)).toContain('राजमा');
  });

  it('builds a grouped shopping list', () => {
    const plan = generateWeek(base, START, 2);
    const list = groceryList(plan);
    expect(list.length).toBeGreaterThan(10);
    expect(new Set(list.map((i) => i.key)).size).toBe(list.length);
    const potato = list.find((i) => i.key === 'potato');
    if (potato) expect(potato.group).toBe('Vegetables & herbs');
  });
});

describe('nutrition and protein focus', () => {
  it('has a serving with sensible numbers for every dish', () => {
    for (const d of [...DISHES, getDish('steamed-rice')]) {
      const n = getNutrition(d.id);
      expect(n, d.id).not.toBeNull();
      expect(n!.serving.length, d.id).toBeGreaterThan(0);
      expect(n!.kcal, d.id).toBeGreaterThan(0);
      expect(n!.kcal, d.id).toBeLessThan(1000);
      // Calories should roughly match protein, carbs and fat (4/4/9 kcal per gram).
      const fromParts = 4 * n!.protein + 4 * n!.carbs + 9 * n!.fat;
      expect(Math.abs(fromParts - n!.kcal) / n!.kcal, d.id).toBeLessThan(0.2);
    }
  });

  it('marks the new protein dishes as protein-rich', () => {
    for (const id of ['sattu-shake', 'soya-keema', 'tofu-bhurji', 'paneer-stuffed-besan-chilla', 'masoor-dal-tikki']) {
      expect(proteinLevel(id), id).toBe('high');
    }
    expect(proteinLevel('dal-makhani')).toBe('good');
    expect(proteinLevel('kabuli-chana-chaat')).toBe('good');
    expect(proteinLevel('jeera-aloo')).toBeNull();
  });

  it('puts more protein on the plate when Protein focus is on, without breaking hard rules', () => {
    const veg: FamilyProfile = { ...base, worldMealsPerWeek: 0, fastDays: [1], jain: true };
    const avg = (focus: boolean) => {
      let total = 0;
      let days = 0;
      for (let seed = 1; seed <= 30; seed++) {
        const plan = generateWeek({ ...veg, proteinFocus: focus }, START, seed);
        for (const day of plan.days) {
          total += dayNutrition(day).protein;
          days++;
        }
        if (focus) {
          for (const { dish } of everyItem(plan)) {
            expect(dish.diet).toBe('Veg');
            expect(dish.jain).toBe(true);
          }
        }
      }
      return total / days;
    };
    const without = avg(false);
    const withFocus = avg(true);
    expect(withFocus).toBeGreaterThan(without + 3);
  });

  it('sums protein for each day of the week', () => {
    const plan = generateWeek(base, START, 4);
    const week = weekProtein(plan);
    expect(week.days).toHaveLength(7);
    expect(week.days[0].protein).toBe(dayNutrition(plan.days[0]).protein);
    expect(week.average).toBe(Math.round(week.days.reduce((a, d) => a + d.protein, 0) / 7));
    expect(week.average).toBeGreaterThan(20);
  });
});

describe('evening snack', () => {
  it('plans a quick, light, Indian snack every day, and a vrat snack on vrat days', () => {
    const p: FamilyProfile = { ...base, fastDays: [1], diet: 'Non-Veg', nonVegDays: [2, 5, 6] };
    for (let seed = 1; seed <= 40; seed++) {
      const plan = generateWeek(p, START, seed);
      for (const day of plan.days) {
        const snack = day.meals.find((m) => m.type === 'Snack')!;
        expect(snack.items).toHaveLength(1);
        const dish = getDish(snack.items[0].dishId);
        expect(isWorldDish(dish), dish.name).toBe(false);
        expect(dish.category, dish.name).not.toBe('Non-Veg Main');
        if (day.isFast) {
          expect(dish.vrat, dish.name).toBe(true);
          expect(snack.items[0].role).toBe('vratSnack');
        } else {
          expect(dish.slots, dish.name).toContain('Snack');
          if (day.weekday < 5) expect(dish.heaviness, dish.name).not.toBe('Heavy');
        }
      }
    }
  });

  it('leaves the snack out when the family turns it off', () => {
    const plan = generateWeek({ ...base, eveningSnack: false }, START, 3);
    for (const day of plan.days) expect(day.meals.map((m) => m.type)).toEqual(['Breakfast', 'Lunch', 'Dinner']);
  });

  it('can swap the snack and names it in messages', () => {
    const plan = generateWeek(base, START, 5);
    const next = swapItem(plan, base, 0, 2, 0, 11);
    expect(next.days[0].meals[2].items[0].dishId).not.toBe(plan.days[0].meals[2].items[0].dishId);
    expect(dayMessage(plan.days[0], base)).toContain(`*${MEAL_NAME.Snack}:*`);
    expect(cookMessage(plan.days[0], base)).toContain('शाम का नाश्ता');
  });
});
