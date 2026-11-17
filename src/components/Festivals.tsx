import { useEffect, useState } from 'react';
import {
  RULE_LABEL,
  WEEKDAYS_SHORT,
  formatDate,
  getFestival,
  parseISODate,
  upcomingFestivals,
  type FamilyProfile,
  type FestivalRule,
  type WeekPlan,
} from '../engine';

/** How far ahead festivals are listed and offered. */
const LIST_DAYS = 120;
const OFFER_DAYS = 120;

const RULES: FestivalRule[] = ['vrat', 'satvik', 'jain'];

function shortDate(iso: string): string {
  const d = parseISODate(iso);
  return `${WEEKDAYS_SHORT[(d.getDay() + 6) % 7]} ${formatDate(iso)}`;
}

export type SaveFestival = (festivalId: string, offered: string[], chosen: string[], rule: FestivalRule) => void;

/** Upcoming festivals; tap one to plan its food. */
export function FestivalCard({ profile, today, onOpen }: { profile: FamilyProfile; today: string; onOpen: (id: string) => void }) {
  const list = upcomingFestivals(today, LIST_DAYS);
  const planned = new Set((profile.festivalDays ?? []).map((f) => `${f.festival}|${f.date}`));
  return (
    <section className="card festivals" aria-labelledby="festivals-title">
      <h3 id="festivals-title">Festivals and fasts</h3>
      <p className="muted small">Tap a festival to choose its days and food.</p>
      {list.length === 0 && <p className="muted small">No festival in the next few weeks.</p>}
      <ul className="festival-list">
        {list.map(({ festival, dates }) => {
          const done = dates.filter((d) => planned.has(`${festival.id}|${d}`)).length;
          return (
            <li key={festival.id}>
              <button type="button" className="festival-row" onClick={() => onOpen(festival.id)}>
                <span className="festival-text">
                  <span className="festival-name">
                    {festival.name} <span className="festival-hi">{festival.hindi}</span>
                  </span>
                  <span className="muted small">{dates.slice(0, 3).map(shortDate).join(' · ')}{dates.length > 3 ? ` +${dates.length - 3} more` : ''}</span>
                </span>
                <span className={`festival-status${done ? ' is-on' : ''}`}>{done ? 'Planned' : 'Plan'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** A one-line nudge when a festival falls in the week on screen and isn't planned yet. */
export function FestivalNudge({ plan, profile, today, onOpen }: { plan: WeekPlan; profile: FamilyProfile; today: string; onOpen: (id: string) => void }) {
  const inWeek = new Set(plan.days.map((d) => d.date).filter((d) => d >= today));
  const planned = new Set((profile.festivalDays ?? []).map((f) => f.date));
  const hit = upcomingFestivals(today, 8)
    .map(({ festival, dates }) => ({ festival, dates: dates.filter((d) => inWeek.has(d) && !planned.has(d)) }))
    .find((x) => x.dates.length);
  if (!hit) return null;
  return (
    <div className="festival-nudge">
      <p>
        <strong>{hit.festival.name}</strong> is on {hit.dates.map(shortDate).join(', ')}. Change the food for {hit.dates.length > 1 ? 'those days' : 'that day'}?
      </p>
      <button type="button" className="btn btn-quiet" onClick={() => onOpen(hit.festival.id)}>
        Choose
      </button>
    </div>
  );
}

/** Pick which days of a festival the family keeps, and what food to plan. */
export function FestivalSheet({
  festivalId,
  profile,
  today,
  onSave,
  onClose,
}: {
  festivalId: string | null;
  profile: FamilyProfile;
  today: string;
  onSave: SaveFestival;
  onClose: () => void;
}) {
  const festival = festivalId ? getFestival(festivalId) : undefined;
  const offered = festival ? upcomingFestivals(today, OFFER_DAYS).find((x) => x.festival.id === festival.id)?.dates ?? [] : [];
  const mine = (profile.festivalDays ?? []).filter((f) => f.festival === festivalId && offered.includes(f.date));
  const [chosen, setChosen] = useState<string[]>([]);
  const [rule, setRule] = useState<FestivalRule>('vrat');

  useEffect(() => {
    if (!festival) return;
    // Start from what the family already planned; otherwise every upcoming day, with the usual food rule.
    setChosen(mine.length ? mine.map((f) => f.date) : offered);
    setRule(mine[0]?.rule ?? festival.rule);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('sheet-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('sheet-open');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festivalId]);

  if (!festival) return null;
  const toggle = (d: string) => setChosen((c) => (c.includes(d) ? c.filter((x) => x !== d) : [...c, d].sort()));

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet picker" role="dialog" aria-modal="true" aria-labelledby="festival-title" onClick={(e) => e.stopPropagation()}>
        <header className="picker-head">
          <div>
            <p className="muted small">{festival.hindi}</p>
            <h2 id="festival-title">{festival.name}</h2>
            <p className="small">{festival.note}</p>
          </div>
          <button type="button" className="sheet-close static" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="picker-body">
          <fieldset className="festival-field">
            <legend>Which days do you keep?</legend>
            <div className="day-checks">
              {offered.map((d) => (
                <label key={d} className={`day-check${chosen.includes(d) ? ' is-on' : ''}`}>
                  <input type="checkbox" checked={chosen.includes(d)} onChange={() => toggle(d)} />
                  {shortDate(d)}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="festival-field">
            <legend>Food on these days</legend>
            <div className="seg" role="radiogroup" aria-label="Food on these days">
              {RULES.map((r) => (
                <button type="button" key={r} role="radio" aria-checked={rule === r} className={`seg-btn${rule === r ? ' is-on' : ''}`} onClick={() => setRule(r)}>
                  {RULE_LABEL[r]}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={() => onSave(festival.id, offered, chosen, rule)}>
              {chosen.length ? `Plan ${chosen.length} ${chosen.length > 1 ? 'days' : 'day'}` : 'Save'}
            </button>
            {mine.length > 0 && (
              <button type="button" className="btn btn-quiet" onClick={() => onSave(festival.id, offered, [], rule)}>
                Don’t plan this festival
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
