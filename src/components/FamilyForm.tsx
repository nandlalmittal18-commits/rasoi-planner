import { useState, type ReactNode } from 'react';
import { WEEKDAYS_SHORT, type CuisineGroup, type Diet, type FamilyProfile } from '../engine';
import { CUISINES, WORLD_CUISINE_OPTIONS } from '../lib/sample';

interface Props {
  initial: FamilyProfile;
  isNew: boolean;
  /** Sign-in card, shown under the heading */
  account?: ReactNode;
  onSave: (p: FamilyProfile) => void;
  onReset: () => void;
}

const DIETS: { key: Diet; label: string }[] = [
  { key: 'Veg', label: 'Vegetarian' },
  { key: 'Egg', label: 'Veg + eggs' },
  { key: 'Non-Veg', label: 'Non-veg' },
];
const TIMES = [30, 45, 60, 90];

export function FamilyForm({ initial, isNew, account, onSave, onReset }: Props) {
  const [p, setP] = useState<FamilyProfile>(initial);
  const [confirmReset, setConfirmReset] = useState(false);
  const set = <K extends keyof FamilyProfile>(key: K, value: FamilyProfile[K]) => setP({ ...p, [key]: value });
  const toggleIn = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...p, familyName: p.familyName.trim(), cookName: p.cookName.trim() });
      }}
    >
      <div className="week-head">
        <div>
          <p className="eyebrow">{isNew ? 'Takes one minute' : 'Your household'}</p>
          <h1>{isNew ? 'Tell us about your family' : 'Family settings'}</h1>
        </div>
      </div>

      {account}

      <fieldset className="card field">
        <legend>Family name</legend>
        <label htmlFor="family-name" className="visually-hidden">
          Family name
        </label>
        <input id="family-name" className="text-input" placeholder="e.g. Mittal" value={p.familyName} onChange={(e) => set('familyName', e.target.value)} />
      </fieldset>

      <fieldset className="card field">
        <legend>What does your family eat?</legend>
        <div className="seg" role="radiogroup" aria-label="Diet">
          {DIETS.map((d) => (
            <button type="button" key={d.key} role="radio" aria-checked={p.diet === d.key} className={`seg-btn${p.diet === d.key ? ' is-on' : ''}`} onClick={() => set('diet', d.key)}>
              {d.label}
            </button>
          ))}
        </div>
        {p.diet !== 'Veg' && (
          <>
            <p className="field-help">On which days do you cook {p.diet === 'Egg' ? 'eggs' : 'non-veg'}?</p>
            <DayPicker id="nonveg-days" value={p.nonVegDays} onChange={(v) => set('nonVegDays', v)} />
          </>
        )}
        <div className="toggles">
          <Toggle id="jain" label="Jain food" help="No onion, garlic, potato or other root vegetables" checked={p.jain} onChange={(v) => set('jain', v)} />
          <Toggle id="nog" label="No onion or garlic" help="Satvik cooking" checked={p.noOnionGarlic} onChange={(v) => set('noOnionGarlic', v)} />
        </div>
      </fieldset>

      <fieldset className="card field">
        <legend>Weekly fast (vrat)</legend>
        <p className="field-help">On these days we plan only vrat food: sabudana, kuttu, samak, makhana and similar.</p>
        <DayPicker id="fast-days" value={p.fastDays} onChange={(v) => set('fastDays', v)} />
      </fieldset>

      <fieldset className="card field">
        <legend>Favourite Indian cuisines</legend>
        <p className="field-help">We’ll suggest these more often. Leave all off for a mix from across India.</p>
        <CuisineGrid options={CUISINES} value={p.cuisines} onToggle={(k) => set('cuisines', toggleIn(p.cuisines, k))} />
      </fieldset>

      <fieldset className="card field">
        <legend>World food</legend>
        <p className="field-help">How many dinners a week should be Chinese, Italian, Continental or similar? “None” keeps every meal Indian.</p>
        <div className="seg" role="radiogroup" aria-label="World-food dinners per week">
          {[0, 1, 2, 3, 4].map((n) => (
            <button type="button" key={n} role="radio" aria-checked={p.worldMealsPerWeek === n} className={`seg-btn${p.worldMealsPerWeek === n ? ' is-on' : ''}`} onClick={() => set('worldMealsPerWeek', n)}>
              {n === 0 ? 'None' : n}
            </button>
          ))}
        </div>
        {p.worldMealsPerWeek > 0 && (
          <>
            <p className="field-help">Which cuisines does your family enjoy? Leave all off for a mix.</p>
            <CuisineGrid options={WORLD_CUISINE_OPTIONS} value={p.cuisines} onToggle={(k) => set('cuisines', toggleIn(p.cuisines, k))} />
          </>
        )}
      </fieldset>

      <fieldset className="card field">
        <legend>Your routine</legend>
        <p className="field-help">Longest a single dish should take on weekdays</p>
        <div className="seg" role="radiogroup" aria-label="Weekday cooking time">
          {TIMES.map((t) => (
            <button type="button" key={t} role="radio" aria-checked={p.weekdayMaxCookTime === t} className={`seg-btn${p.weekdayMaxCookTime === t ? ' is-on' : ''}`} onClick={() => set('weekdayMaxCookTime', t)}>
              {t} min
            </button>
          ))}
        </div>
        <div className="toggles">
          <Toggle id="kids" label="Children at home" help="Kid favourites come up more often" checked={p.hasKids} onChange={(v) => set('hasKids', v)} />
          <Toggle id="tiffin" label="Pack tiffin on weekdays" help="Weekday lunch will travel well in a lunchbox" checked={p.packsTiffin} onChange={(v) => set('packsTiffin', v)} />
        </div>
      </fieldset>

      <fieldset className="card field">
        <legend>Cook’s name (optional)</legend>
        <p className="field-help">Used to greet your cook in the Hindi WhatsApp message.</p>
        <label htmlFor="cook-name" className="visually-hidden">
          Cook’s name
        </label>
        <input id="cook-name" className="text-input" placeholder="e.g. Sunita" value={p.cookName} onChange={(e) => set('cookName', e.target.value)} />
      </fieldset>

      {p.dislikes.length > 0 && (
        <p className="muted small">
          {p.dislikes.length} dish{p.dislikes.length === 1 ? '' : 'es'} marked “never suggest” in the Dish library.
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-wide">
          {isNew ? 'Make my weekly menu' : 'Save and make a new menu'}
        </button>
        {!isNew &&
          (confirmReset ? (
            <div className="confirm">
              <span>Delete this family and its menu, and start again?</span>
              <button type="button" className="btn btn-danger btn-small" onClick={onReset}>
                Yes, delete
              </button>
              <button type="button" className="btn btn-quiet btn-small" onClick={() => setConfirmReset(false)}>
                Keep it
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-quiet" onClick={() => setConfirmReset(true)}>
              Start over
            </button>
          ))}
      </div>
    </form>
  );
}

function CuisineGrid({
  options,
  value,
  onToggle,
}: {
  options: { key: CuisineGroup; label: string; hint: string }[];
  value: CuisineGroup[];
  onToggle: (key: CuisineGroup) => void;
}) {
  return (
    <div className="cuisine-grid">
      {options.map((c) => {
        const on = value.includes(c.key);
        return (
          <button type="button" key={c.key} className={`cuisine${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => onToggle(c.key)}>
            <span className="cuisine-name">{c.label}</span>
            <span className="cuisine-hint">{c.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

function DayPicker({ id, value, onChange }: { id: string; value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="day-picker" role="group" aria-label="Days" id={id}>
      {WEEKDAYS_SHORT.map((d, i) => {
        const on = value.includes(i);
        return (
          <button type="button" key={d} className={`day-chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== i) : [...value, i].sort())}>
            {d}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ id, label, help, checked, onChange }: { id: string; label: string; help: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle" htmlFor={id}>
      <span className="toggle-text">
        <span className="toggle-label">{label}</span>
        <span className="toggle-help">{help}</span>
      </span>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}
