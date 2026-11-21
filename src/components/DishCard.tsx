import type { ReactNode } from 'react';
import { getNutrition, hasVideo, proteinLevel, type Dish } from '../engine';
import { DishPicture } from './DishPicture';
import { FoodMark } from './icons';

/** A dish as a big photo with its name and key facts underneath. */
export function DishCard({
  dish,
  onOpen,
  action,
  note,
  dimmed = false,
}: {
  dish: Dish;
  onOpen: (id: string) => void;
  /** Small button placed on the photo (swap, never suggest…) */
  action?: ReactNode;
  /** Extra line under the facts, e.g. a prep reminder */
  note?: ReactNode;
  dimmed?: boolean;
}) {
  const level = proteinLevel(dish.id);
  const protein = level ? Math.round(getNutrition(dish.id)!.protein) : null;
  return (
    <article className={`dcard${dimmed ? ' is-dimmed' : ''}`}>
      <div className="dcard-media">
        <button className="dcard-photo" onClick={() => onOpen(dish.id)} aria-label={`${dish.name}: see recipe and details`}>
          <DishPicture dish={dish} size={320} cover />
        </button>
        {protein !== null && <span className={`dcard-badge${level === 'high' ? ' is-high' : ''}`}>{protein} g protein</span>}
        {hasVideo(dish.id) && (
          <span className="dcard-video" title="Has a how-to video">
            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
            Video
          </span>
        )}
        {action && <div className="dcard-action">{action}</div>}
      </div>
      <button className="dcard-body" onClick={() => onOpen(dish.id)} tabIndex={-1} aria-hidden="true">
        <span className="dcard-name">
          <FoodMark diet={dish.diet} /> {dish.name}
        </span>
        <span className="dcard-facts">
          {dish.cookTime} min · {dish.heaviness === 'Heavy' ? 'Filling' : dish.heaviness}
        </span>
        <span className="dcard-sub">
          <span lang="hi">{dish.hindi}</span>
          {dish.region !== 'Pan-India' && dish.region !== 'Modern' ? `, ${dish.region}` : ''}
        </span>
      </button>
      {note && <div className="dcard-note">{note}</div>}
    </article>
  );
}
