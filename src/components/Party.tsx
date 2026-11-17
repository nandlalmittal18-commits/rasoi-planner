import { useEffect, useMemo, useState } from 'react';
import {
  GROCERY_GROUPS,
  getDish,
  groceryMessage,
  partyCookMessage,
  partyMenu,
  partyMessage,
  partyShopping,
  randomSeed,
  swapPartyCourse,
  whatsappLink,
  type FamilyProfile,
  type PartyMeal,
  type PartyMenu,
  type PartyStyle,
} from '../engine';
import { DishPicture } from './DishPicture';
import { ShuffleIcon, SwapIcon, WhatsAppIcon } from './icons';

const STYLES: { key: PartyStyle; label: string }[] = [
  { key: 'usual', label: 'Our usual' },
  { key: 'North', label: 'North Indian' },
  { key: 'South', label: 'South Indian' },
  { key: 'West', label: 'Gujarati & Marathi' },
];

/** Small card on the menu page that opens the party planner. */
export function PartyCard({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="card party-card" aria-labelledby="party-title">
      <div>
        <h3 id="party-title">Guests coming?</h3>
        <p className="muted small">A full menu for guests, with the shopping amounts and a Hindi message for the cook.</p>
      </div>
      <button type="button" className="btn btn-quiet" onClick={onOpen}>
        Plan a party menu
      </button>
    </section>
  );
}

/** Plan a menu for guests: starters to sweet, swap any course, share it and its shopping list. */
export function PartyPlanner({ open, profile, onClose, onOpenDish }: { open: boolean; profile: FamilyProfile; onClose: () => void; onOpenDish: (id: string) => void }) {
  const family = (profile.adults ?? 2) + (profile.kids ?? (profile.hasKids ? 1 : 0));
  const [guests, setGuests] = useState(family + 6);
  const [meal, setMeal] = useState<PartyMeal>('Dinner');
  const [style, setStyle] = useState<PartyStyle>('usual');
  const [menu, setMenu] = useState<PartyMenu | null>(null);

  // A fresh menu whenever the meal or style changes (guests only change the amounts).
  useEffect(() => {
    if (open) setMenu(partyMenu(profile, guests, meal, style, randomSeed()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, meal, style, profile]);

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

  const sized = menu ? { ...menu, guests } : null;
  const shopping = useMemo(() => (sized ? partyShopping(sized) : []), [sized?.courses, guests]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open || !sized) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet picker party" role="dialog" aria-modal="true" aria-labelledby="party-sheet-title" onClick={(e) => e.stopPropagation()}>
        <header className="picker-head">
          <div>
            <p className="muted small">Guests coming</p>
            <h2 id="party-sheet-title">Party menu</h2>
          </div>
          <button type="button" className="sheet-close static" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="picker-body">
          <div className="party-settings">
            <div className="stepper" role="group" aria-labelledby="guests-label">
              <span id="guests-label" className="stepper-label">
                People
              </span>
              <button type="button" className="stepper-btn" onClick={() => setGuests(Math.max(2, guests - 1))} aria-label="Fewer people">
                −
              </button>
              <output className="stepper-value" aria-live="polite">
                {guests}
              </output>
              <button type="button" className="stepper-btn" onClick={() => setGuests(Math.min(200, guests + 1))} aria-label="More people">
                +
              </button>
            </div>
            <div className="seg" role="radiogroup" aria-label="Meal">
              {(['Lunch', 'Dinner'] as PartyMeal[]).map((m) => (
                <button type="button" key={m} role="radio" aria-checked={meal === m} className={`seg-btn${meal === m ? ' is-on' : ''}`} onClick={() => setMeal(m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="seg" role="radiogroup" aria-label="Kind of food">
            {STYLES.map((s) => (
              <button type="button" key={s.key} role="radio" aria-checked={style === s.key} className={`seg-btn${style === s.key ? ' is-on' : ''}`} onClick={() => setStyle(s.key)}>
                {s.label}
              </button>
            ))}
          </div>

          <ol className="party-courses">
            {sized.courses.map((c, i) => {
              const d = getDish(c.dishId);
              return (
                <li key={`${c.key}-${i}`} className="party-course">
                  <button type="button" className="party-dish" onClick={() => onOpenDish(d.id)}>
                    <DishPicture dish={d} size={56} cover />
                    <span className="pick-text">
                      <span className="muted small">{c.label}</span>
                      <span className="pick-name">{d.name}</span>
                    </span>
                  </button>
                  <button type="button" className="base-swap" onClick={() => setMenu(swapPartyCourse(sized, profile, i, randomSeed()))} aria-label={`Swap ${d.name}`} title={`Swap ${d.name}`}>
                    <SwapIcon />
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="btn-row">
            <a className="btn btn-wa" href={whatsappLink(partyMessage(sized, profile))} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> Send menu
            </a>
            <a className="btn btn-wa-outline" href={whatsappLink(partyCookMessage(sized, profile))} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> Cook, in Hindi
            </a>
            <button type="button" className="btn btn-quiet" onClick={() => setMenu(partyMenu(profile, guests, meal, style, randomSeed()))}>
              <ShuffleIcon /> New menu
            </button>
          </div>

          <details className="party-shop">
            <summary>
              Shopping for {guests} people <span className="muted small">({shopping.filter((i) => i.amount).length} items with amounts)</span>
            </summary>
            <p className="muted small">Rough amounts. Party portions are a little smaller, since there are more dishes. Spices and oil are left out.</p>
            {GROCERY_GROUPS.map((g) => {
              const rows = shopping.filter((i) => i.group === g);
              if (!rows.length) return null;
              return (
                <div key={g} className="party-shop-group">
                  <h4>{g}</h4>
                  <ul>
                    {rows.map((i) => (
                      <li key={i.key}>
                        <span>{i.name}</span>
                        {i.amount && <strong>{i.amount}</strong>}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <a className="btn btn-wa" href={whatsappLink(groceryMessage(shopping, new Set()))} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> Send shopping list
            </a>
          </details>
        </div>
      </div>
    </div>
  );
}
