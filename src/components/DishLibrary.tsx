import { useMemo, useState } from 'react';
import { DISHES, WORLD_CUISINES, cuisineOf, isWorldDish, type Dish, type FamilyProfile } from '../engine';
import { FoodMark } from './icons';

const MEALS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'] as const;
const FLAGS: { key: keyof Dish; label: string }[] = [
  { key: 'jain', label: 'Jain' },
  { key: 'noOnionGarlic', label: 'No onion-garlic' },
  { key: 'vrat', label: 'Vrat' },
  { key: 'tiffin', label: 'Tiffin' },
  { key: 'kidFavourite', label: 'Kids love it' },
];

export function DishLibrary({ profile, onToggleDislike }: { profile: FamilyProfile; onToggleDislike: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [meal, setMeal] = useState<(typeof MEALS)[number]>('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [flags, setFlags] = useState<Set<keyof Dish>>(new Set());
  const [cuisine, setCuisine] = useState<string>('All');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DISHES.filter(
      (d) =>
        (!q || d.name.toLowerCase().includes(q) || d.hindi.includes(q) || d.ingredients.some((i) => i.toLowerCase().includes(q)) || d.region.toLowerCase().includes(q)) &&
        (meal === 'All' || d.slots.includes(meal)) &&
        (!vegOnly || d.diet === 'Veg') &&
        (cuisine === 'All' || (cuisine === 'Indian' ? !isWorldDish(d) : cuisineOf(d) === cuisine)) &&
        [...flags].every((f) => d[f] === true),
    );
  }, [query, meal, vegOnly, flags, cuisine]);

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
          <button className={`chip chip-toggle${vegOnly ? ' is-on' : ''}`} aria-pressed={vegOnly} onClick={() => setVegOnly(!vegOnly)}>
            Veg only
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

      <ul className="library">
        {shown.map((d) => {
          const disliked = profile.dislikes.includes(d.id);
          return (
            <li key={d.id} className={`card lib-row${disliked ? ' is-disliked' : ''}`}>
              <div className="lib-main">
                <FoodMark diet={d.diet} />
                <div className="dish-text">
                  <span className="dish-name">{d.name}</span>
                  <span className="dish-hindi" lang="hi">
                    {d.hindi}
                  </span>
                  <span className="dish-meta">
                    {d.category} · {d.region} · {d.cookTime} min · {d.difficulty}
                  </span>
                  <span className="dish-meta">{d.ingredients.join(', ')}</span>
                </div>
              </div>
              <div className="lib-foot">
                <div className="chips">
                  {d.jain && <span className="chip chip-sm">Jain</span>}
                  {d.vrat && <span className="chip chip-sm chip-vrat">Vrat</span>}
                  {d.tiffin && <span className="chip chip-sm">Tiffin</span>}
                  {d.season !== 'All' && <span className="chip chip-sm">{d.season}</span>}
                  {d.prepAhead && <span className="chip chip-sm chip-prep">{d.prepAhead}</span>}
                </div>
                <button className={`btn btn-small ${disliked ? 'btn-primary' : 'btn-quiet'}`} onClick={() => onToggleDislike(d.id)} aria-pressed={disliked}>
                  {disliked ? 'Suggest again' : 'Never suggest'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {shown.length === 0 && <p className="muted">No dish matches. Remove a filter or change the search.</p>}
    </div>
  );
}
