import { useEffect, useMemo, useState } from 'react';
import {
  FRIDGE_ITEMS,
  MEAL_NAME,
  WEEKDAYS_SHORT,
  cookFromFridge,
  formatDate,
  getDish,
  placesFor,
  type FamilyProfile,
  type WeekPlan,
} from '../engine';
import { DishCard } from './DishCard';

/** Pick what you have; see dishes that use it, and put one straight into this week's menu. */
export function FridgeFinder({
  profile,
  plan,
  today,
  onOpenDish,
  onChoose,
}: {
  profile: FamilyProfile;
  plan: WeekPlan;
  today: string;
  onOpenDish: (id: string) => void;
  onChoose: (day: number, meal: number, dishId: string) => void;
}) {
  const [have, setHave] = useState<string[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  // The most common items first; the rest behind "More" (chosen ones always stay visible).
  const shownItems = all ? FRIDGE_ITEMS : FRIDGE_ITEMS.filter((i, n) => n < 14 || have.includes(i.key));
  const found = useMemo(() => cookFromFridge(have, profile), [have, profile]);
  const toggle = (k: string) => setHave((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k]));

  return (
    <section className="card fridge" aria-labelledby="fridge-title">
      <div className="fridge-head">
        <div>
          <h2 id="fridge-title">What’s in your fridge?</h2>
          <p className="muted small">Tap what you have. We’ll show dishes that use it.</p>
        </div>
        {have.length > 0 && (
          <button type="button" className="btn btn-quiet" onClick={() => setHave([])}>
            Clear
          </button>
        )}
      </div>
      <div className="fridge-items">
        {shownItems.map((i) => (
          <button key={i.key} type="button" className={`chip chip-toggle${have.includes(i.key) ? ' is-on' : ''}`} aria-pressed={have.includes(i.key)} onClick={() => toggle(i.key)}>
            {i.label}
          </button>
        ))}
        {!all && (
          <button type="button" className="chip chip-more" onClick={() => setAll(true)}>
            More…
          </button>
        )}
      </div>

      {have.length > 0 && found.length === 0 && <p className="muted">No dish uses these within your family’s food rules.</p>}
      {found.length > 0 && (
        <div className="dcard-grid fridge-results">
          {found.map(({ dish, uses, needs }) => (
            <DishCard
              key={dish.id}
              dish={dish}
              onOpen={onOpenDish}
              action={
                <button type="button" className="photo-btn" onClick={() => setAdding(dish.id)}>
                  + Add to menu
                </button>
              }
              note={
                <p className="fridge-note">
                  <span className="fridge-uses">Uses {uses.join(', ').toLowerCase()}</span>
                  {needs.length > 0 && <span className="muted"> · also needs {needs.slice(0, 3).join(', ')}</span>}
                </p>
              }
            />
          ))}
        </div>
      )}

      <AddToMenu
        dishId={adding}
        plan={plan}
        profile={profile}
        today={today}
        onClose={() => setAdding(null)}
        onPick={(day, meal) => {
          if (adding) onChoose(day, meal, adding);
          setAdding(null);
        }}
      />
    </section>
  );
}

/** Choose the day and meal for a dish. Only meals where it keeps the family's rules are offered. */
function AddToMenu({
  dishId,
  plan,
  profile,
  today,
  onPick,
  onClose,
}: {
  dishId: string | null;
  plan: WeekPlan;
  profile: FamilyProfile;
  today: string;
  onPick: (day: number, meal: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!dishId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('sheet-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('sheet-open');
    };
  }, [dishId, onClose]);

  const places = useMemo(() => (dishId ? placesFor(plan, profile, dishId, today) : []), [dishId, plan, profile, today]);
  if (!dishId) return null;
  const dish = getDish(dishId);
  const days = [...new Set(places.map((p) => p.day))];

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet picker" role="dialog" aria-modal="true" aria-labelledby="add-title" onClick={(e) => e.stopPropagation()}>
        <header className="picker-head">
          <div>
            <p className="muted small">Add to this week’s menu</p>
            <h2 id="add-title">{dish.name}</h2>
            <p className="small">It replaces the main dish of the meal you pick. Roti or rice is chosen to match.</p>
          </div>
          <button type="button" className="sheet-close static" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="picker-body">
          {places.length === 0 && <p className="muted">This dish doesn’t fit any meal left this week (for example, it isn’t vrat food on a vrat day).</p>}
          {days.map((d) => {
            const day = plan.days[d];
            return (
              <div key={day.date} className="add-day">
                <h3>
                  {WEEKDAYS_SHORT[day.weekday]} {formatDate(day.date)}
                </h3>
                <div className="add-meals">
                  {places
                    .filter((p) => p.day === d)
                    .map((p) => {
                      const meal = day.meals[p.meal];
                      const now = meal.items.find((i) => i.role !== 'base') ?? meal.items[0];
                      return (
                        <button key={p.meal} type="button" className="add-meal" onClick={() => onPick(p.day, p.meal)}>
                          <strong>{MEAL_NAME[p.type]}</strong>
                          {now && <span className="muted small">instead of {getDish(now.dishId).name}</span>}
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
