import { useEffect, useRef, useState } from 'react';
import { getDish, getRecipe, recipeMessage, whatsappLink } from '../engine';
import { NutritionPanel } from './NutritionPanel';
import { copyText } from '../lib/clipboard';
import { usePhoto } from '../lib/photos';
import { DishPicture } from './DishPicture';
import { CopyIcon, FoodMark, WhatsAppIcon } from './icons';

interface Props {
  dishId: string | null;
  onClose: () => void;
  notify: (msg: string) => void;
}

const DIET_TEXT = { Veg: 'Vegetarian', Egg: 'Contains egg', 'Non-Veg': 'Non-vegetarian' } as const;

/** Full details of one dish: picture, facts from the dish sheet, ingredients and recipe. */
export function DishSheet({ dishId, onClose, notify }: Props) {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const photo = usePhoto(dishId ?? '');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!dishId) return;
    const before = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
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
  }, [dishId, onClose]);

  if (!dishId) return null;
  const d = getDish(dishId);
  const recipe = getRecipe(dishId);
  const steps = recipe?.[lang] ?? [];
  const tags = [
    d.jain && 'Jain OK',
    d.noOnionGarlic && 'No onion-garlic OK',
    d.vrat && 'Vrat OK',
    d.tiffin && 'Good for tiffin',
    d.kidFavourite && 'Kids love it',
  ].filter(Boolean) as string[];

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-hero">
          <DishPicture dish={d} size={220} className="sheet-art" cover />
          <button ref={closeRef} type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
          {photo?.credit && (
            <p className="photo-credit">
              Photo:{' '}
              {photo.page ? (
                <a href={photo.page} target="_blank" rel="noopener noreferrer">
                  {photo.credit}
                </a>
              ) : (
                photo.credit
              )}
              {photo.license ? `, ${photo.license}` : ''}
            </p>
          )}
        </div>

        <div className="sheet-body">
          <div className="sheet-title">
            <h2 id="sheet-title">{d.name}</h2>
            <p className="sheet-hindi" lang="hi">
              {d.hindi}
            </p>
            <p className="sheet-diet">
              <FoodMark diet={d.diet} /> {DIET_TEXT[d.diet]} · {d.region} · {d.category}
            </p>
          </div>

          <dl className="facts">
            <div>
              <dt>Cooking</dt>
              <dd>{d.cookTime} min</dd>
            </div>
            <div>
              <dt>Difficulty</dt>
              <dd>{d.difficulty}</dd>
            </div>
            <div>
              <dt>Heaviness</dt>
              <dd>{d.heaviness}</dd>
            </div>
            <div>
              <dt>Season</dt>
              <dd>{d.season === 'All' ? 'Any' : d.season}</dd>
            </div>
          </dl>

          {tags.length > 0 && (
            <ul className="tag-row" aria-label="Good for">
              {tags.map((t) => (
                <li key={t} className="tag">
                  ✓ {t}
                </li>
              ))}
            </ul>
          )}

          {d.prepAhead && (
            <p className="sheet-prep">
              <strong>Plan ahead:</strong> {d.prepAhead}
            </p>
          )}

          <NutritionPanel dishId={d.id} />

          <section aria-labelledby="ing-title">
            <h3 id="ing-title">Main ingredients</h3>
            <ul className="ingredients">
              {d.ingredients.map((i) => (
                <li key={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="recipe-title">
            <div className="recipe-head">
              <h3 id="recipe-title">How to make it</h3>
              <div className="lang-toggle" role="radiogroup" aria-label="Recipe language">
                <button type="button" role="radio" aria-checked={lang === 'en'} className={lang === 'en' ? 'is-on' : ''} onClick={() => setLang('en')}>
                  English
                </button>
                <button type="button" role="radio" aria-checked={lang === 'hi'} className={lang === 'hi' ? 'is-on' : ''} onClick={() => setLang('hi')} lang="hi">
                  हिंदी
                </button>
              </div>
            </div>
            <ol className="steps" lang={lang}>
              {steps.map((s, i) => (
                <li key={i}>
                  <span className="step-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <p className="muted small">Spices and quantities to your family’s taste.</p>
          </section>

          {d.pairsWith.length > 0 && (
            <p className="pairs">
              <strong>Goes well with:</strong> {d.pairsWith.join(', ')}
            </p>
          )}

          <div className="btn-row sheet-actions">
            <a className="btn btn-wa" href={whatsappLink(recipeMessage(d, 'hi'))} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> Send recipe to cook
            </a>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={async () => notify((await copyText(recipeMessage(d, lang))) ? 'Recipe copied' : 'Copying is blocked here')}
            >
              <CopyIcon /> Copy recipe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
