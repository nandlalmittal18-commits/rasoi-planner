import { getNutrition, proteinLevel } from '../engine';

/** Small "14 g protein" pill for dishes that are a good or high source of protein. */
export function ProteinPill({ dishId }: { dishId: string }) {
  const level = proteinLevel(dishId);
  if (!level) return null;
  const grams = Math.round(getNutrition(dishId)!.protein);
  return (
    <span className={`protein-pill${level === 'high' ? ' is-high' : ''}`} title={`About ${grams} g protein per serving`}>
      {grams} g protein
    </span>
  );
}
