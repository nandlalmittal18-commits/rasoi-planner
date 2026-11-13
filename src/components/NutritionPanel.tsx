import { getNutrition, proteinLevel, richness, NUTRITION_NOTE } from '../engine';

/** Approximate nutrition for one home serving, shown on the dish screen. */
export function NutritionPanel({ dishId }: { dishId: string }) {
  const n = getNutrition(dishId);
  if (!n) return null;
  const level = proteinLevel(dishId);
  const rich = richness(dishId);
  const badges = [
    level === 'high' && { text: 'High protein', cls: 'nb-protein' },
    level === 'good' && { text: 'Good protein', cls: 'nb-protein-soft' },
    n.fibre >= 6 && { text: 'High fibre', cls: 'nb-fibre' },
    rich === 'light' && { text: 'Light', cls: 'nb-light' },
    rich === 'rich' && { text: 'Rich — enjoy sometimes', cls: 'nb-rich' },
  ].filter(Boolean) as { text: string; cls: string }[];

  return (
    <section className="nutri" aria-labelledby="nutri-title">
      <div className="nutri-head">
        <h3 id="nutri-title">Nutrition</h3>
        <span className="nutri-serving">per {n.serving}</span>
      </div>
      <div className="nutri-grid">
        <div className="nutri-protein">
          <span className="nutri-big">{fmt(n.protein)}</span>
          <span className="nutri-unit">g</span>
          <span className="nutri-label">Protein</span>
        </div>
        <dl className="nutri-rest">
          <div>
            <dt>Calories</dt>
            <dd>{n.kcal}</dd>
          </div>
          <div>
            <dt>Carbs</dt>
            <dd>{fmt(n.carbs)} g</dd>
          </div>
          <div>
            <dt>Fat</dt>
            <dd>{fmt(n.fat)} g</dd>
          </div>
          <div>
            <dt>Fibre</dt>
            <dd>{fmt(n.fibre)} g</dd>
          </div>
        </dl>
      </div>
      {badges.length > 0 && (
        <ul className="nutri-badges">
          {badges.map((b) => (
            <li key={b.text} className={`nb ${b.cls}`}>
              {b.text}
            </li>
          ))}
        </ul>
      )}
      <p className="nutri-note">{NUTRITION_NOTE}</p>
    </section>
  );
}

const fmt = (v: number) => (v >= 10 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, ''));
