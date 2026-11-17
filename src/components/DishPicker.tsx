import { useEffect, useMemo, useRef, useState } from 'react';
import { MEAL_NAME, WEEKDAYS, formatDate, getDish, getNutrition, mainChoices, type FamilyProfile, type WeekPlan } from '../engine';
import { DishPicture } from './DishPicture';
import { FoodMark, ShuffleIcon } from './icons';

export interface PickTarget {
  day: number;
  meal: number;
}

interface Props {
  target: PickTarget | null;
  plan: WeekPlan;
  profile: FamilyProfile;
  onPick: (target: PickTarget, dishId: string) => void;
  /** Let the app pick another dish that fits */
  onSurprise: (target: PickTarget) => void;
  onClose: () => void;
}

/** Choose the main dish of one meal by hand. Only dishes that keep the family's food rules are listed. */
export function DishPicker({ target, plan, profile, onPick, onSurprise, onClose }: Props) {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!target) return;
    setQuery('');
    const before = document.activeElement as HTMLElement | null;
    // Focus the search box on big screens; on phones it would pop the keyboard over the list.
    if (window.matchMedia('(min-width: 700px)').matches) searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('sheet-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('sheet-open');
      before?.focus?.();
    };
  }, [target, onClose]);

  const choices = useMemo(
    () => (target ? mainChoices(plan, profile, target.day, target.meal) : []),
    [target, plan, profile],
  );

  if (!target) return null;
  const day = plan.days[target.day];
  const meal = day.meals[target.meal];
  const current = meal.items.find((i) => i.role !== 'base') ?? meal.items[0];
  const q = query.trim().toLowerCase();
  const shown = q
    ? choices.filter(({ dish }) => `${dish.name} ${dish.hindi} ${dish.region} ${dish.ingredients.join(' ')}`.toLowerCase().includes(q))
    : choices;
  const best = shown.filter((c) => c.fits);
  const more = shown.filter((c) => !c.fits);
  const when = `${WEEKDAYS[day.weekday]}, ${formatDate(day.date)}`;

  const row = (dishId: string) => {
    const d = getDish(dishId);
    const n = getNutrition(d.id);
    return (
      <li key={d.id}>
        <button type="button" className="pick-row" onClick={() => onPick(target, d.id)}>
          <DishPicture dish={d} size={56} cover />
          <span className="pick-text">
            <span className="pick-name">
              <FoodMark diet={d.diet} /> {d.name}
            </span>
            <span className="pick-meta">
              {d.cookTime} min{n ? ` · ${Math.round(n.protein)} g protein` : ''} · {d.region}
            </span>
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet picker" role="dialog" aria-modal="true" aria-labelledby="picker-title" onClick={(e) => e.stopPropagation()}>
        <header className="picker-head">
          <div>
            <p className="muted small">{when}{day.isFast ? ' · vrat day' : ''}</p>
            <h2 id="picker-title">Change {MEAL_NAME[meal.type].toLowerCase()}</h2>
            {current && <p className="small">Now: <strong>{getDish(current.dishId).name}</strong></p>}
          </div>
          <button type="button" className="sheet-close static" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="picker-tools">
          <label className="visually-hidden" htmlFor="picker-search">
            Search dishes
          </label>
          <input
            ref={searchRef}
            id="picker-search"
            className="search"
            type="search"
            placeholder="Search a dish or ingredient"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="btn btn-quiet" onClick={() => onSurprise(target)}>
            <ShuffleIcon /> Pick for me
          </button>
        </div>

        <div className="picker-body">
          {choices.length === 0 && <p className="muted">No other dish fits your family’s food rules for this meal.</p>}
          {choices.length > 0 && shown.length === 0 && <p className="muted">No dish matches “{query}”.</p>}
          {best.length > 0 && (
            <section>
              <h3>Good for this {MEAL_NAME[meal.type].toLowerCase()}</h3>
              <ul className="pick-list">{best.map((c) => row(c.dish.id))}</ul>
            </section>
          )}
          {more.length > 0 && (
            <section>
              <h3>Also fine</h3>
              <p className="muted small">These keep your food rules but repeat a dish this week, take longer on a weekday, or are out of season.</p>
              <ul className="pick-list">{more.map((c) => row(c.dish.id))}</ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
