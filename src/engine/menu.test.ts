import { describe, expect, it } from 'vitest';
import {
  DISHES,
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
  hasKids: true,
  packsTiffin: true,
  weekdayMaxCookTime: 45,
  dislikes: [],
  cookName: '',
};

function everyItem(plan: WeekPlan) {
  return plan.days.flatMap((day) =>
    day.meals.flatMap((meal) => meal.items.map((item) => ({ day, meal, item, dish: getDish(item.dishId) }))),
  );
}

describe('dish data', () => {
  it('has 153 dishes with unique ids and Hindi names', () => {
    expect(DISHES).toHaveLength(153);
    expect(new Set(DISHES.map((d) => d.id)).size).toBe(153);
    expect(DISHES.every((d) => d.hindi.length > 0)).toBe(true);
  });
});

describe('generateWeek', () => {
  it('fills 7 days × 3 meals for the default family', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const plan = generateWeek(base, START, seed);
      expect(plan.days).toHaveLength(7);
      for (const day of plan.days) {
        expect(day.meals.map((m) => m.type)).toEqual(['Breakfast', 'Lunch', 'Dinner']);
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
        cuisines: (['North', 'West', 'South', 'East'] as const).filter((_, i) => r(20 + i) > 0.5),
        hasKids: r(30) > 0.5,
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
        expect(meal.items.length).toBeGreaterThan(0);
      }
    }
    expect(checked).toBeGreaterThan(3000);
  });

  it('cooks non-veg only on the chosen days', () => {
    const profile: FamilyProfile = { ...base, diet: 'Non-Veg', nonVegDays: [2, 5, 6] };
    const plan = generateWeek(profile, START, 7);
    const nonVegDays = new Set(everyItem(plan).filter((x) => x.dish.diet !== 'Veg').map((x) => x.day.weekday));
    for (const d of nonVegDays) expect([2, 5, 6]).toContain(d);
    expect(nonVegDays.size).toBeGreaterThan(0);
  });

  it('plans only vrat food on fasting days', () => {
    const profile: FamilyProfile = { ...base, fastDays: [1] };
    const plan = generateWeek(profile, START, 3);
    const tuesday = plan.days.find((d) => d.weekday === 1)!;
    expect(tuesday.isFast).toBe(true);
    for (const meal of tuesday.meals) for (const i of meal.items) expect(getDish(i.dishId).vrat).toBe(true);
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
    const prep = prepForDay(plan.days[0]);
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
