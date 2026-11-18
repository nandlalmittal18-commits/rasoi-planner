import { useEffect, useMemo, useState } from 'react';
import {
  DRINKS,
  DRINK_NOTE,
  DRINK_TAGS,
  drinkCookMessage,
  drinkFits,
  drinkOfTheDay,
  getDrink,
  whatsappLink,
  type Drink,
  type DrinkTag,
  type FamilyProfile,
} from '../engine';
import { seasonFor } from '../engine/util';
import { copyText } from '../lib/clipboard';
import { DrinkPicture } from './DrinkPicture';
import { CopyIcon, WhatsAppIcon } from './icons';

const SEASONS = ['All year', 'Winter', 'Summer', 'Monsoon'] as const;
const TIME_TEXT: Record<Drink['time'], string> = {
  Morning: 'Best in the morning',
  'Any time': 'Any time of day',
  Evening: 'Best in the evening',
  Night: 'Best at bedtime',
  'After meals': 'After a meal',
  'Before meals': 'Before a meal',
};

/** A drink as a card: picture, name, what it's good for. */
function DrinkCard({ drink, onOpen, fits }: { drink: Drink; onOpen: (id: string) => void; fits: boolean }) {
  return (
    <button type="button" className={`drink-card${fits ? '' : ' is-dimmed'}`} onClick={() => onOpen(drink.id)}>
      <span className="drink-card-media">
        <DrinkPicture drink={drink} />
        <span className="drink-kind">{drink.kind}</span>
      </span>
      <span className="drink-card-body">
        <span className="drink-name">{drink.name}</span>
        <span className="drink-hi" lang="hi">
          {drink.hindi}
        </span>
        <span className="drink-benefit">{drink.benefits[0]}</span>
        <span className="drink-tags">
          {drink.tags.slice(0, 3).map((t) => (
            <span key={t} className="drink-tag">
              {t}
            </span>
          ))}
        </span>
        {!fits && <span className="muted small">Doesn’t fit your family’s food rules</span>}
      </span>
    </button>
  );
}

/** The Drinks screen: drink of the day, filters by benefit and season, and every drink. */
export function DrinksView({ profile, onOpen }: { profile: FamilyProfile; onOpen: (id: string) => void }) {
  const now = new Date();
  const season = seasonFor(now);
  const [tag, setTag] = useState<DrinkTag | null>(null);
  const [when, setWhen] = useState<(typeof SEASONS)[number] | 'Now'>('Now');
  const [query, setQuery] = useState('');
  const today = drinkOfTheDay(profile, now);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DRINKS.filter(
      (d) =>
        (!tag || d.tags.includes(tag)) &&
        (when === 'All year' ? true : when === 'Now' ? d.season === season || d.season === 'All' : d.season === when || d.season === 'All') &&
        (!q || `${d.name} ${d.hindi} ${d.benefits.join(' ')} ${d.ingredients.map((i) => i.en).join(' ')}`.toLowerCase().includes(q)),
    ).sort((a, b) => Number(drinkFits(b, profile)) - Number(drinkFits(a, profile)));
  }, [tag, when, query, season, profile]);

  return (
    <div className="stack">
      <div className="week-head">
        <div>
          <p className="eyebrow">{DRINKS.length} healthy Indian drinks</p>
          <h1>Juices and drinks</h1>
        </div>
      </div>

      {today && (
        <section className="drink-hero" aria-labelledby="drink-today">
          <button type="button" className="drink-hero-pic" onClick={() => onOpen(today.id)} aria-label={`${today.name}: see benefits and recipe`}>
            <DrinkPicture drink={today} cover={false} />
          </button>
          <div className="drink-hero-text">
            <p className="drink-hero-label">Drink of the day</p>
            <h2 id="drink-today">{today.name}</h2>
            <p className="drink-hi" lang="hi">
              {today.hindi}
            </p>
            <ul className="benefit-list">
              {today.benefits.slice(0, 2).map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <button type="button" className="btn btn-primary" onClick={() => onOpen(today.id)}>
              See benefits and recipe
            </button>
          </div>
        </section>
      )}

      <section className="card drink-filters" aria-label="Find a drink">
        <h2 className="filters-title">What is it good for?</h2>
        <div className="chips">
          {DRINK_TAGS.map((t) => (
            <button key={t} type="button" className={`chip chip-toggle${tag === t ? ' is-on' : ''}`} aria-pressed={tag === t} onClick={() => setTag(tag === t ? null : t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="drink-filter-row">
          <div className="seg" role="radiogroup" aria-label="Season">
            {(['Now', ...SEASONS] as const).map((s) => (
              <button type="button" key={s} role="radio" aria-checked={when === s} className={`seg-btn${when === s ? ' is-on' : ''}`} onClick={() => setWhen(s)}>
                {s === 'Now' ? `In season now (${season})` : s}
              </button>
            ))}
          </div>
          <label className="visually-hidden" htmlFor="drink-search">
            Search drinks
          </label>
          <input id="drink-search" className="search" type="search" placeholder="Search: amla, protein, chaas…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </section>

      {shown.length === 0 && <p className="muted">No drink matches. Try another filter or “All year”.</p>}
      <div className="drink-grid">
        {shown.map((d) => (
          <DrinkCard key={d.id} drink={d} onOpen={onOpen} fits={drinkFits(d, profile)} />
        ))}
      </div>

      <p className="drink-note small">{DRINK_NOTE}</p>
    </div>
  );
}

/** Full details of one drink: benefits, cautions, ingredients and recipe. */
export function DrinkSheet({ drinkId, profile, onClose, notify }: { drinkId: string | null; profile: FamilyProfile; onClose: () => void; notify: (msg: string) => void }) {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  useEffect(() => {
    if (!drinkId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('sheet-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('sheet-open');
    };
  }, [drinkId, onClose]);

  const d = drinkId ? getDrink(drinkId) : undefined;
  if (!d) return null;
  const cookText = drinkCookMessage(d, profile);
  const fits = drinkFits(d, profile);
  const facts = [
    d.kind,
    d.season === 'All' ? 'All year' : `${d.season} drink`,
    TIME_TEXT[d.time],
    `${d.minutes} min`,
    d.serving,
    d.vrat && 'Vrat OK',
    d.jain && 'Jain OK',
  ].filter(Boolean) as string[];
  const lauki = d.id === 'lauki-juice';

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="drink-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-hero drink-sheet-hero">
          <DrinkPicture drink={d} cover={false} />
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="sheet-body">
          <div className="sheet-title">
            <h2 id="drink-title">{d.name}</h2>
            <p className="sheet-hindi" lang="hi">
              {d.hindi}
            </p>
            <div className="drink-facts">
              {facts.map((f) => (
                <span key={f} className="chip">
                  {f}
                </span>
              ))}
            </div>
            {!fits && <p className="field-error">This drink doesn’t fit your family’s food rules (Jain or no onion-garlic).</p>}
          </div>

          <section>
            <h3>Health benefits</h3>
            <ul className="benefit-list">
              {d.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="drink-tags">
              {d.nutrients.map((n) => (
                <span key={n} className="drink-tag">
                  {n}
                </span>
              ))}
            </div>
          </section>

          <section className={`drink-caution${lauki ? ' is-danger' : ''}`}>
            <h3>Good to know</h3>
            <ul>
              {d.caution.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>

          <section>
            <div className="recipe-head">
              <h3>How to make it</h3>
              <div className="seg" role="radiogroup" aria-label="Language">
                {(['en', 'hi'] as const).map((l) => (
                  <button type="button" key={l} role="radio" aria-checked={lang === l} className={`seg-btn${lang === l ? ' is-on' : ''}`} onClick={() => setLang(l)}>
                    {l === 'en' ? 'English' : 'हिंदी'}
                  </button>
                ))}
              </div>
            </div>
            <ul className="drink-ingredients" lang={lang}>
              {d.ingredients.map((i) => (
                <li key={i.en}>{i[lang]}</li>
              ))}
            </ul>
            <ol className="drink-steps" lang={lang}>
              {d.steps[lang].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </section>

          <div className="btn-row">
            <a className="btn btn-wa-outline" href={whatsappLink(cookText)} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> Send recipe to cook
            </a>
            <button type="button" className="btn btn-quiet" onClick={async () => notify((await copyText(cookText)) ? 'Hindi recipe copied' : 'Copying is blocked here')}>
              <CopyIcon /> Copy Hindi recipe
            </button>
          </div>
          <p className="drink-note small">{DRINK_NOTE}</p>
        </div>
      </div>
    </div>
  );
}

/** Small card on the menu page with today's drink. */
export function DrinkTodayCard({ profile, onOpen }: { profile: FamilyProfile; onOpen: (id: string) => void }) {
  const d = drinkOfTheDay(profile, new Date());
  if (!d) return null;
  return (
    <section className="card drink-today-card" aria-labelledby="drink-today-title">
      <button type="button" className="drink-today-pic" onClick={() => onOpen(d.id)} aria-label={`${d.name}: see benefits and recipe`}>
        <DrinkPicture drink={d} />
      </button>
      <div>
        <p className="muted small">Drink of the day</p>
        <h3 id="drink-today-title">{d.name}</h3>
        <p className="small">{d.benefits[0]}</p>
        <button type="button" className="link-btn drink-link" onClick={() => onOpen(d.id)}>
          Benefits and recipe
        </button>
      </div>
    </section>
  );
}
