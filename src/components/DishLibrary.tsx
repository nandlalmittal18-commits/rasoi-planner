import { useMemo, useState } from 'react';
import { DISHES, WORLD_CUISINES, cuisineOf, getNutrition, isWorldDish, proteinLevel, type Dish, type FamilyProfile, type WeekPlan } from '../engine';
import { DishCard } from './DishCard';
import { FridgeFinder } from './Fridge';
import { DishPicture } from './DishPicture';
import { getDish } from '../engine';

const MEALS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'] as const;

/** Quick picks at the top of the library, each shown with a dish that has a good photo. */
const CRAVINGS: { key: string; label: string; dish: string; test: (d: Dish) => boolean }[] = [
  { key: 'north', label: 'North Indian', dish: 'chole-chana-masala', test: (d) => cuisineOf(d) === 'North' },
  { key: 'south', label: 'South Indian', dish: 'masala-dosa', test: (d) => cuisineOf(d) === 'South' },
  { key: 'protein', label: 'High protein', dish: 'kabuli-chana-chaat', test: (d) => proteinLevel(d.id) === 'high' },
  { key: 'quick', label: 'Ready in 20 min', dish: 'poha', test: (d) => d.cookTime <= 20 },
  { key: 'vrat', label: 'Vrat food', dish: 'sabudana-khichdi', test: (d) => d.vrat },
  { key: 'snacks', label: 'Snacks', dish: 'samosa', test: (d) => d.slots.includes('Snack') },
  { key: 'chinese', label: 'Chinese', dish: 'schezwan-noodles', test: (d) => cuisineOf(d) === 'Chinese' },
  { key: 'italian', label: 'Italian', dish: 'veggie-pizza', test: (d) => cuisineOf(d) === 'Italian' },
  { key: 'sweets', label: 'Sweets', dish: 'gulab-jamun', test: (d) => d.category === 'Sweet' },
];
const FLAGS: { key: keyof Dish; label: string }[] = [
  { key: 'jain', label: 'Jain' },
  { key: 'noOnionGarlic', label: 'No onion-garlic' },
  { key: 'vrat', label: 'Vrat' },
  { key: 'tiffin', label: 'Tiffin' },
  { key: 'kidFavourite', label: 'Kids love it' },
];

export function DishLibrary({
  profile,
  plan,
  today,
  onToggleDislike,
  onOpenDish,
  onChoose,
}: {
  profile: FamilyProfile;
  plan: WeekPlan;
  today: string;
  onToggleDislike: (id: string) => void;
  onOpenDish: (id: string) => void;
  onChoose: (day: number, meal: number, dishId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [meal, setMeal] = useState<(typeof MEALS)[number]>('All');
  const [flags, setFlags] = useState<Set<keyof Dish>>(new Set());
  const [cuisine, setCuisine] = useState<string>('All');
  const [proteinOnly, setProteinOnly] = useState(false);
  const [craving, setCraving] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = DISHES.filter(
      (d) =>
        (!q || d.name.toLowerCase().includes(q) || d.hindi.includes(q) || d.ingredients.some((i) => i.toLowerCase().includes(q)) || d.region.toLowerCase().includes(q)) &&
        (meal === 'All' || d.slots.includes(meal)) &&
        (cuisine === 'All' || (cuisine === 'Indian' ? !isWorldDish(d) : cuisineOf(d) === cuisine)) &&
        [...flags].every((f) => d[f] === true) &&
        (!proteinOnly || proteinLevel(d.id) !== null) &&
        (!craving || CRAVINGS.find((c) => c.key === craving)!.test(d)),
    );
    // With the protein filter on, show the most protein first.
    return proteinOnly ? list.sort((a, b) => (getNutrition(b.id)?.protein ?? 0) - (getNutrition(a.id)?.protein ?? 0)) : list;
  }, [query, meal, flags, cuisine, proteinOnly, craving]);

  const toggleFlag = (f: keyof Dish) => {
    const next = new Set(flags);
    if (next.has(f)) next.delete(f);
    else next.add(f);
    setFlags(next);
  };

  return (
    <div className="stack">
      <div className="week-head">
        <div>
          <p className="eyebrow">{DISHES.length} dishes from India and the world</p>
          <h1>Dish library</h1>
        </div>
      </div>

      <FridgeFinder profile={profile} plan={plan} today={today} onOpenDish={onOpenDish} onChoose={onChoose} />

      <section className="cravings" aria-labelledby="crave-title">
        <h2 id="crave-title">What are you in the mood for?</h2>
        <div className="crave-row">
          {CRAVINGS.map((c) => (
            <button key={c.key} className={`crave${craving === c.key ? ' is-on' : ''}`} aria-pressed={craving === c.key} onClick={() => setCraving(craving === c.key ? null : c.key)}>
              <DishPicture dish={getDish(c.dish)} size={104} />
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="card filters">
        <label className="visually-hidden" htmlFor="dish-search">
          Search dishes
        </label>
        <input
          id="dish-search"
          className="search"
          type="search"
          placeholder="Search a dish, ingredient or region"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="select-wrap" htmlFor="cuisine-filter">
          <span>Cuisine</span>
          <select id="cuisine-filter" value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
            <option value="All">All cuisines</option>
            <option value="Indian">Indian</option>
            {WORLD_CUISINES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className="seg" role="group" aria-label="Meal">
          {MEALS.map((m) => (
            <button key={m} className={`seg-btn${meal === m ? ' is-on' : ''}`} aria-pressed={meal === m} onClick={() => setMeal(m)}>
              {m}
            </button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Filters">
          <button className={`chip chip-toggle${proteinOnly ? ' is-on' : ''}`} aria-pressed={proteinOnly} onClick={() => setProteinOnly(!proteinOnly)}>
            Protein-rich
          </button>
          {FLAGS.map((f) => (
            <button key={f.key} className={`chip chip-toggle${flags.has(f.key) ? ' is-on' : ''}`} aria-pressed={flags.has(f.key)} onClick={() => toggleFlag(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <p className="muted small" aria-live="polite">
          Showing {shown.length} of {DISHES.length}
        </p>
      </div>

      <div className="dcard-grid library">
        {shown.map((d) => {
          const disliked = profile.dislikes.includes(d.id);
          return (
            <DishCard
              key={d.id}
              dish={d}
              onOpen={onOpenDish}
              dimmed={disliked}
              action={
                <button className={`photo-btn${disliked ? ' is-on' : ''}`} onClick={() => onToggleDislike(d.id)} aria-pressed={disliked}>
                  {disliked ? 'Suggest again' : 'Never suggest'}
                </button>
              }
              note={d.prepAhead ? <span className="chip chip-sm chip-prep">{d.prepAhead}</span> : undefined}
            />
          );
        })}
      </div>
      {shown.length === 0 && <p className="muted">No dish matches. Remove a filter or change the search.</p>}
    </div>
  );
}
