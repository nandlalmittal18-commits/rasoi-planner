import { useEffect } from 'react';
import {
  WEEKDAYS,
  formatDate,
  getDish,
  kidsTiffinWeek,
  parseISODate,
  randomSeed,
  swapTiffinDay,
  tiffinCookMessage,
  tiffinMessage,
  whatsappLink,
  type FamilyProfile,
  type TiffinDay,
  type WeekPlan,
} from '../engine';
import { DishPicture } from './DishPicture';
import { ShuffleIcon, SwapIcon, WhatsAppIcon } from './icons';

/** Card on the menu page; shown when the family has children. */
export function TiffinCard({ plan, onOpen }: { plan: WeekPlan; onOpen: () => void }) {
  const first = plan.kidsTiffin?.[0];
  return (
    <section className="card party-card" aria-labelledby="tiffin-title">
      <div>
        <h3 id="tiffin-title">Kids’ tiffin</h3>
        <p className="muted small">
          {first ? `Planned for ${plan.kidsTiffin!.length} school days, starting with ${getDish(first.dishId).name}.` : 'Monday to Friday: something quick that travels well, and a fruit.'}
        </p>
      </div>
      <button type="button" className="btn btn-quiet" onClick={onOpen}>
        {first ? 'See tiffin week' : 'Plan the tiffin week'}
      </button>
    </section>
  );
}

/** Plan, swap and share the children's tiffin for the school days of this week. */
export function TiffinPlanner({
  open,
  plan,
  profile,
  onSave,
  onClose,
  onOpenDish,
}: {
  open: boolean;
  plan: WeekPlan;
  profile: FamilyProfile;
  onSave: (t: TiffinDay[]) => void;
  onClose: () => void;
  onOpenDish: (id: string) => void;
}) {
  // Plan it the first time it's opened; after that it stays with this week's menu.
  useEffect(() => {
    if (open && !plan.kidsTiffin) onSave(kidsTiffinWeek(plan, profile, randomSeed()));
  }, [open, plan, profile, onSave]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('sheet-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('sheet-open');
    };
  }, [open, onClose]);

  const tiffin = plan.kidsTiffin;
  if (!open || !tiffin) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet picker party" role="dialog" aria-modal="true" aria-labelledby="tiffin-sheet-title" onClick={(e) => e.stopPropagation()}>
        <header className="picker-head">
          <div>
            <p className="muted small">School days this week</p>
            <h2 id="tiffin-sheet-title">Kids’ tiffin</h2>
            <p className="small">Quick to make in the morning, travels well, and kids usually like it. Different from what the family eats that day.</p>
          </div>
          <button type="button" className="sheet-close static" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="picker-body">
          {tiffin.length === 0 && <p className="muted">No school days left in this week’s menu.</p>}
          <ol className="party-courses">
            {tiffin.map((t, i) => {
              const d = getDish(t.dishId);
              const w = t.withId ? getDish(t.withId) : null;
              return (
                <li key={t.date} className="party-course">
                  <button type="button" className="party-dish" onClick={() => onOpenDish(d.id)}>
                    <DishPicture dish={d} size={56} cover />
                    <span className="pick-text">
                      <span className="muted small">
                        {WEEKDAYS[(parseISODate(t.date).getDay() + 6) % 7]}, {formatDate(t.date)}
                      </span>
                      <span className="pick-name">
                        {d.name}
                        {w ? ` + ${w.name}` : ''}
                      </span>
                      <span className="fruit-chip">{t.fruit}</span>
                    </span>
                  </button>
                  <button type="button" className="base-swap" onClick={() => onSave(swapTiffinDay(plan, profile, tiffin, i, randomSeed()))} aria-label={`Swap ${d.name}`} title={`Swap ${d.name}`}>
                    <SwapIcon />
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="btn-row">
            <a className="btn btn-wa-outline" href={whatsappLink(tiffinCookMessage(tiffin, profile))} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> Cook, in Hindi
            </a>
            <a className="btn btn-wa" href={whatsappLink(tiffinMessage(tiffin, profile))} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> Family
            </a>
            <button type="button" className="btn btn-quiet" onClick={() => onSave(kidsTiffinWeek(plan, profile, randomSeed()))}>
              <ShuffleIcon /> New tiffin week
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
