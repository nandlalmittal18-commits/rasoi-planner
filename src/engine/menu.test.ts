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
  servingsFor,
  formatAmount,
  groceryMessage,
  isStaple,
  prepForDay,
  regenerateDay,
  swapItem,
  setMainDish,
  rateDish,
  mainChoices,
  weekMessage,
  weekTable,
  FESTIVALS,
  DRINKS,
  DRINK_TAGS,
  drinkFits,
  CAFE_STYLES,
  drinkOfTheDay,
  drinkCookMessage,
  cookTemplateParams,
  cookSpeech,
  kidsTiffinWeek,
  swapTiffinDay,
  tiffinMessage,
  tiffinCookMessage,
  partyMenu,
  swapPartyCourse,
  partyMessage,
  partyCookMessage,
  partyShopping,
  cookFromFridge,
  placesFor,
  planFestival,
  upcomingFestivals,
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
  it('has 197 dishes with unique, plain ids and Hindi names', () => {
    expect(DISHES).toHaveLength(197);
    expect(new Set(DISHES.map((d) => d.id)).size).toBe(197);
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

  it('gives rough amounts for the family size, rounded to shop sizes', () => {
    const plan = generateWeek(base, START, 2);
    const one = groceryList(plan, 1);
    const four = groceryList(plan, servingsFor({ adults: 3, kids: 2, hasKids: true }));
    const withAmount = one.filter((i) => i.grams);
    expect(withAmount.length).toBeGreaterThan(one.length / 2);
    for (const i of withAmount) {
      const big = four.find((x) => x.key === i.key)!;
      expect(big.grams! / i.grams!).toBeCloseTo(4.2, 5);
      expect(big.amount).toMatch(/^\d+(\.\d+)? (g|kg|ml|L)$/);
    }
    expect(formatAmount(120)).toBe('150 g');
    expect(formatAmount(730)).toBe('800 g');
    expect(formatAmount(1320)).toBe('1.5 kg');
    expect(formatAmount(2060, true)).toBe('2.25 L');
    expect(servingsFor({ hasKids: false })).toBe(2);
    expect(groceryMessage(four, new Set())).toMatch(/• \w.* – \d/);
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

describe('choosing a dish by hand', () => {
  const LUNCH = 1;

  it('offers only dishes that keep every hard rule, best fits first', () => {
    const strict: FamilyProfile = { ...base, jain: true, fastDays: [1], dislikes: ['rajma'] };
    const plan = generateWeek(strict, START, 3);
    for (const dayIndex of [0, 1]) {
      for (let m = 0; m < plan.days[dayIndex].meals.length; m++) {
        const choices = mainChoices(plan, strict, dayIndex, m);
        const current = plan.days[dayIndex].meals[m].items.find((i) => i.role !== 'base')?.dishId;
        // A Jain vrat day can have just one dish that fits, and it is already planned.
        if (!plan.days[dayIndex].isFast) expect(choices.length, `day ${dayIndex} meal ${m}`).toBeGreaterThan(0);
        for (const { dish } of choices) {
          expect(dish.jain, dish.name).toBe(true);
          expect(dish.id).not.toBe('rajma');
          expect(dish.id).not.toBe(current);
          if (plan.days[dayIndex].isFast) expect(dish.vrat, dish.name).toBe(true);
        }
        const firstMisfit = choices.findIndex((c) => !c.fits);
        if (firstMisfit >= 0) expect(choices.slice(firstMisfit).every((c) => !c.fits)).toBe(true);
      }
    }
  });

  it('puts the chosen dish in the meal, re-picks roti/rice and leaves other days alone', () => {
    const plan = generateWeek(base, START, 5);
    const pick = mainChoices(plan, base, 2, LUNCH).find((c) => c.dish.category === 'Paneer')!;
    const next = setMainDish(plan, base, 2, LUNCH, pick.dish.id, 1);
    const meal = next.days[2].meals[LUNCH];
    expect(meal.items[0].dishId).toBe(pick.dish.id);
    expect(meal.items.some((i) => i.role === 'base')).toBe(true);
    expect(meal.tiffin).toBe(plan.days[2].meals[LUNCH].tiffin);
    for (const d of [0, 1, 3, 4, 5, 6]) expect(next.days[d]).toEqual(plan.days[d]);
  });

  it('can turn any dinner into a world-food dinner with a side of the same cuisine', () => {
    const plan = generateWeek(base, START, 6);
    const day = plan.days.findIndex((d) => !d.worldDinner);
    const pasta = getDish('red-sauce-pasta');
    const next = setMainDish(plan, base, day, DINNER, pasta.id, 2);
    expect(next.days[day].meals[DINNER].items[0].dishId).toBe(pasta.id);
    expect(next.days[day].worldDinner).toBe(true);
    for (const i of next.days[day].meals[DINNER].items) expect(cuisineOf(getDish(i.dishId))).toBe(cuisineOf(pasta));
  });

  it('refuses a dish that breaks a hard rule', () => {
    const jain: FamilyProfile = { ...base, jain: true };
    const plan = generateWeek(jain, START, 7);
    expect(setMainDish(plan, jain, 0, LUNCH, 'aloo-gobi', 1)).toBe(plan);
  });

  it('sends the week with every meal on its own line', () => {
    const plan = generateWeek(base, START, 8);
    const text = weekMessage(plan, base);
    const table = weekTable(plan);
    expect(table.meals).toEqual(['Breakfast', 'Lunch', 'Snack', 'Dinner']);
    expect(table.rows).toHaveLength(7);
    expect(text).toContain('*Mon 16 Nov*');
    expect(text.match(/🍳 Breakfast:/g)).toHaveLength(7);
    expect(text.match(/☕ Evening snack:/g)).toHaveLength(7);
    expect(text.match(/🌙 Dinner:/g)).toHaveLength(7);
    expect(text).not.toContain('\uFE0F');
  });
});

describe('festivals the family keeps', () => {
  it('has festival dates in order, all real dates', () => {
    for (const f of FESTIVALS) {
      expect(f.dates.length, f.id).toBeGreaterThan(0);
      expect([...f.dates].sort()).toEqual(f.dates);
      for (const d of f.dates) expect(d).toMatch(/^202[6-9]-\d\d-\d\d$/);
    }
    const soon = upcomingFestivals('2026-11-17', 30);
    expect(soon[0].festival.id).toBe('ekadashi');
    expect(soon[0].dates).toEqual(['2026-12-04']);
  });

  it('makes chosen days vrat, satvik or Jain, and leaves other days alone', () => {
    let p = planFestival(base, 'ekadashi', ['2026-11-18'], ['2026-11-18'], 'vrat'); // Wednesday
    p = planFestival(p, 'karwa-chauth', ['2026-11-19'], ['2026-11-19'], 'satvik'); // Thursday
    p = planFestival(p, 'paryushan', ['2026-11-20'], ['2026-11-20'], 'jain'); // Friday
    for (let seed = 1; seed <= 5; seed++) {
      const plan = generateWeek(p, START, seed);
      const [, , wed, thu, fri] = plan.days;
      expect(wed.isFast).toBe(true);
      expect(wed.festival).toBe('ekadashi');
      expect(wed.worldDinner).toBe(false);
      for (const m of wed.meals) for (const i of m.items) expect(getDish(i.dishId).vrat, i.dishId).toBe(true);
      for (const m of thu.meals) for (const i of m.items) expect(getDish(i.dishId).noOnionGarlic, i.dishId).toBe(true);
      for (const m of fri.meals) for (const i of m.items) expect(getDish(i.dishId).jain, i.dishId).toBe(true);
      expect(plan.days[0].isFast).toBe(false);
    }
    const plan = generateWeek(p, START, 1);
    expect(dayMessage(plan.days[2], p)).toContain('🙏 Ekadashi');
    expect(cookMessage(plan.days[4], p)).toContain('पर्युषण');
    expect(weekMessage(plan, p)).toContain('🙏 Karwa Chauth (satvik, no onion-garlic)');
  });

  it('unticking a day removes it, and other festivals stay', () => {
    let p = planFestival(base, 'ekadashi', ['2026-12-04', '2026-12-20'], ['2026-12-04', '2026-12-20'], 'vrat');
    p = planFestival(p, 'maha-shivratri', ['2027-03-06'], ['2027-03-06'], 'vrat');
    p = planFestival(p, 'ekadashi', ['2026-12-04', '2026-12-20'], ['2026-12-20'], 'satvik');
    expect(p.festivalDays).toEqual([
      { date: '2026-12-20', festival: 'ekadashi', rule: 'satvik' },
      { date: '2027-03-06', festival: 'maha-shivratri', rule: 'vrat' },
    ]);
  });
});

describe('thumbs up / down', () => {
  const count = (p: FamilyProfile, ids: string[]) => {
    let n = 0;
    for (let seed = 1; seed <= 30; seed++) for (const { dish } of everyItem(generateWeek(p, START, seed))) if (ids.includes(dish.id)) n++;
    return n;
  };

  it('brings liked dishes more often and disliked ones less, without breaking rules', () => {
    const liked = ['rajma', 'poha', 'paneer-butter-masala'];
    const disliked = ['dal-tadka', 'jeera-aloo', 'upma'];
    let p: FamilyProfile = base;
    for (const id of liked) p = rateDish(p, id, 1);
    for (const id of disliked) p = rateDish(p, id, -1);
    expect(count(p, liked)).toBeGreaterThan(count(base, liked) * 1.5);
    expect(count(p, disliked)).toBeLessThan(count(base, disliked) * 0.6);
    // A thumbs up never beats a hard rule: Jain families still get no root vegetables.
    const jain = rateDish({ ...base, jain: true }, 'aloo-paratha', 1);
    for (const { dish } of everyItem(generateWeek(jain, START, 3))) expect(dish.jain, dish.name).toBe(true);
  });

  it('clears a rating', () => {
    expect(rateDish(rateDish(base, 'rajma', 1), 'rajma', 0).ratings).toEqual({});
  });
});

describe("what's in my fridge", () => {
  it('finds dishes that use what you have, most matches first', () => {
    const found = cookFromFridge(['paneer', 'capsicum'], base);
    expect(found.length).toBeGreaterThan(5);
    expect(found[0].uses).toEqual(['Paneer', 'Capsicum']);
    expect(found.map((f) => f.dish.id)).toContain('kadai-paneer');
    for (const f of found) expect(f.uses.length).toBeGreaterThan(0);
    expect(found.find((f) => f.dish.id === 'palak-paneer')?.needs).toEqual(['spinach', 'cream']);
  });

  it('keeps the family rules and nothing when nothing is chosen', () => {
    const jain: FamilyProfile = { ...base, jain: true, dislikes: ['kadai-paneer'] };
    for (const f of cookFromFridge(['paneer', 'tomato'], jain)) {
      expect(f.dish.jain, f.dish.name).toBe(true);
      expect(f.dish.id).not.toBe('kadai-paneer');
    }
    expect(cookFromFridge([], base)).toEqual([]);
  });

  it('says where in the week a dish can go', () => {
    const plan = generateWeek(base, START, 9);
    const places = placesFor(plan, base, 'kadai-paneer', plan.days[0].date);
    expect(places.length).toBeGreaterThan(0);
    for (const p of places) expect(['Lunch', 'Dinner']).toContain(p.type);
  });
});

describe('guest / party menu', () => {
  it('plans starters, mains, rice, roti, raita and a sweet, keeping food rules', () => {
    const jain: FamilyProfile = { ...base, jain: true };
    for (let seed = 1; seed <= 10; seed++) {
      const m = partyMenu(jain, 12, 'Dinner', 'usual', seed);
      const keys = m.courses.map((c) => c.key);
      expect(keys.filter((k) => k === 'starter')).toHaveLength(2);
      for (const k of ['paneer', 'dal', 'rice', 'bread', 'sweet']) expect(keys, `seed ${seed}`).toContain(k);
      expect(new Set(m.courses.map((c) => c.dishId)).size).toBe(m.courses.length);
      for (const c of m.courses) expect(getDish(c.dishId).jain, c.dishId).toBe(true);
    }
  });

  it('makes a South Indian party without roti, and swaps one course', () => {
    const m = partyMenu(base, 8, 'Lunch', 'South', 4);
    const keys = m.courses.map((c) => c.key);
    expect(keys).not.toContain('bread');
    expect(m.courses.find((c) => c.label === 'Sambar or rasam')).toBeTruthy();
    const i = m.courses.findIndex((c) => c.key === 'sweet');
    const next = swapPartyCourse(m, base, i, 9);
    expect(next.courses[i].dishId).not.toBe(m.courses[i].dishId);
    expect(next.courses[i].label).toBe('Sweet');
  });

  it('shares the menu and scales shopping to the guests', () => {
    const m = partyMenu(base, 10, 'Dinner', 'North', 2);
    expect(partyMessage(m, base)).toContain('dinner for 10');
    expect(partyCookMessage(m, { ...base, cookName: 'Sunita' })).toContain('Sunita जी');
    const small = partyShopping({ ...m, guests: 5 });
    const big = partyShopping(m);
    const item = big.find((i) => i.grams)!;
    expect(item.grams! / small.find((x) => x.key === item.key)!.grams!).toBeCloseTo(2, 5);
  });
});

describe("kids' tiffin week", () => {
  it('packs a quick, tiffin-friendly dish and a fruit each school day, no repeats', () => {
    const jain: FamilyProfile = { ...base, jain: true, fastDays: [1] };
    for (let seed = 1; seed <= 8; seed++) {
      const plan = generateWeek(jain, START, seed);
      const week = kidsTiffinWeek(plan, jain, seed);
      expect(week.map((t) => t.date)).toEqual(plan.days.filter((d) => d.weekday <= 4).map((d) => d.date));
      expect(new Set(week.map((t) => t.dishId)).size).toBe(week.length);
      for (const t of week) {
        const d = getDish(t.dishId);
        expect(d.tiffin, d.name).toBe(true);
        expect(d.jain, d.name).toBe(true);
        expect(d.cookTime).toBeLessThanOrEqual(30);
        expect(t.fruit).toBeTruthy();
        if (d.category === 'Sabzi (Dry)') expect(t.withId).toBeTruthy();
      }
    }
  });

  it('swaps one day and writes the messages', () => {
    const plan = generateWeek(base, START, 3);
    const week = kidsTiffinWeek(plan, base, 3);
    const next = swapTiffinDay(plan, base, week, 2, 5);
    expect(next[2].dishId).not.toBe(week[2].dishId);
    expect(next[0]).toEqual(week[0]);
    expect(tiffinMessage(week, base)).toContain('*Mon 16 Nov:*');
    expect(tiffinCookMessage(week, { ...base, cookName: 'Sunita' })).toContain('फल:');
  });
});

describe('daily message to the cook', () => {
  it('fills the WhatsApp template with clean, non-empty Hindi values', () => {
    const p = planFestival({ ...base, cookName: 'Sunita' }, 'ekadashi', ['2026-11-18'], ['2026-11-18'], 'vrat');
    for (let seed = 1; seed <= 6; seed++) {
      const plan = generateWeek(p, START, seed);
      for (const day of plan.days) {
        const v = cookTemplateParams(day, p);
        expect(v).toHaveLength(7);
        for (const x of v) {
          expect(x.length).toBeGreaterThan(0);
          expect(x).not.toMatch(/[\n\t]| {5}/);
        }
        expect(v[0]).toBe('Sunita');
      }
      expect(cookTemplateParams(plan.days[2], p)[1]).toBe('बुधवार, 18 नवंबर (एकादशी)');
    }
  });

  it('reads the day aloud in plain Hindi', () => {
    const plan = generateWeek({ ...base, cookName: 'Sunita' }, START, 1);
    const text = cookSpeech(plan.days[0], { ...base, cookName: 'Sunita' });
    expect(text.startsWith('नमस्ते Sunita जी।')).toBe(true);
    expect(text).toContain('नाश्ते में');
    expect(text).not.toMatch(/[*_🙏]/u);
  });
});

describe('juices and drinks', () => {
  it('has complete drinks: benefits, cautions, Hindi steps, known tags', () => {
    expect(DRINKS.length).toBeGreaterThanOrEqual(50);
    expect(DRINKS.filter((d) => d.group === 'Mixed juices').length).toBeGreaterThanOrEqual(12);
    expect(new Set(DRINKS.map((d) => d.id)).size).toBe(DRINKS.length);
    for (const d of DRINKS) {
      if (d.group === 'Mocktails' || d.group === 'Cafe') {
        // Party and café drinks make no health claims.
        expect(d.benefits, d.id).toEqual([]);
        expect(d.tags, d.id).toEqual([]);
        expect(d.highlights!.length, d.id).toBeGreaterThanOrEqual(2);
        expect(d.steps.en.length, d.id).toBe(d.steps.hi.length);
        continue;
      }
      expect(d.benefits.length, d.id).toBeGreaterThanOrEqual(2);
      expect(d.caution.length, d.id).toBeGreaterThan(0);
      expect(d.steps.en.length, d.id).toBe(d.steps.hi.length);
      for (const t of d.tags) expect(DRINK_TAGS).toContain(t);
    }
    // The bitter-lauki warning must always be there.
    expect(DRINKS.find((d) => d.id === 'lauki-juice')!.caution[0]).toMatch(/bitter/i);
    expect(DRINKS.find((d) => d.id === 'ash-gourd-juice')!.caution[0]).toMatch(/bitter/i);
    expect(DRINKS.find((d) => d.id === 'papaya-juice')!.caution.join(' ')).toMatch(/pregnancy/i);
  });

  it('keeps Jain, satvik and vrat rules', () => {
    const jain: FamilyProfile = { ...base, jain: true };
    expect(drinkFits(DRINKS.find((d) => d.id === 'beetroot-juice')!, jain)).toBe(false);
    expect(drinkFits(DRINKS.find((d) => d.id === 'sol-kadhi')!, { ...base, noOnionGarlic: true })).toBe(false);
    const tuesdayVrat: FamilyProfile = { ...base, fastDays: [1] };
    const tue = new Date(2026, 10, 17);
    expect(drinkFits(DRINKS.find((d) => d.id === 'sattu-sharbat')!, tuesdayVrat, tue)).toBe(false);
    expect(drinkFits(DRINKS.find((d) => d.id === 'coconut-water')!, tuesdayVrat, tue)).toBe(true);
  });

  it('suggests a different, in-season drink each day that keeps the rules', () => {
    const p: FamilyProfile = { ...base, jain: true, fastDays: [1] };
    const week = Array.from({ length: 7 }, (_, i) => drinkOfTheDay(p, new Date(2026, 10, 16 + i))!);
    expect(new Set(week.map((d) => d.id)).size).toBeGreaterThanOrEqual(6);
    week.forEach((d, i) => {
      const date = new Date(2026, 10, 16 + i);
      expect(drinkFits(d, p, date), d.id).toBe(true);
      expect(['Winter', 'All']).toContain(d.season);
      expect(d.group).not.toBe('Traditional drinks');
      expect(d.group).not.toBe('Mocktails');
    });
    // Over a whole year, never a mocktail or a coffee as the drink of the day.
    for (let i = 0; i < 365; i += 3) expect(['Mocktails', 'Cafe']).not.toContain(drinkOfTheDay(base, new Date(2026, 0, 1 + i))!.group);
    expect(DRINKS.filter((d) => d.group === 'Mocktails').length).toBeGreaterThanOrEqual(15);
  });

  it('has 20 coffee, tea and chocolate drinks with honest caffeine notes', () => {
    const cafe = DRINKS.filter((d) => d.group === 'Cafe');
    expect(cafe.length).toBe(20);
    for (const d of cafe) {
      expect(CAFE_STYLES, d.id).toContain(d.style);
      expect(['High', 'Medium', 'Low'], d.id).toContain(d.caffeine);
      expect(typeof d.hot, d.id).toBe('boolean');
      expect(d.caution.join(' '), d.id).toMatch(/caffeine/i);
      expect(d.time, d.id).not.toBe('Night');
      expect(d.vrat, d.id).toBe(false);
    }
    // Tea and coffee get the "an hour away from meals" iron note.
    for (const d of cafe.filter((x) => x.style !== 'Chocolate' && x.id !== 'affogato')) expect(d.caution.join(' '), d.id).toMatch(/hour/);
    // Ginger or ice cream is not Jain.
    expect(drinkFits(DRINKS.find((d) => d.id === 'masala-chai')!, { ...base, jain: true })).toBe(false);
    expect(drinkFits(DRINKS.find((d) => d.id === 'affogato')!, { ...base, jain: true })).toBe(false);
    expect(drinkFits(DRINKS.find((d) => d.id === 'filter-coffee')!, { ...base, jain: true })).toBe(true);
  });

  it('writes the recipe for the cook in Hindi, with the lauki warning', () => {
    const msg = drinkCookMessage(DRINKS.find((d) => d.id === 'lauki-juice')!, { ...base, cookName: 'Sunita' });
    expect(msg).toContain('Sunita जी');
    expect(msg).toContain('विधि');
    expect(msg).toContain('कड़वी');
  });
});
