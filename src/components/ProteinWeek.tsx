import { PROTEIN_GUIDE, WEEKDAYS_SHORT, weekProtein, type WeekPlan } from '../engine';

/** Protein per day for one person this week, against the ICMR-NIN guide of about 46–54 g a day. */
export function ProteinWeek({ plan, selected, onSelect }: { plan: WeekPlan; selected: number; onSelect: (i: number) => void }) {
  const { days, average } = weekProtein(plan);
  if (!days.length) return null;
  const top = Math.max(70, ...days.map((d) => d.protein)) * 1.12;
  const pct = (g: number) => `${(g / top) * 100}%`;
  const short = days.filter((d) => d.protein < PROTEIN_GUIDE.low).length;

  return (
    <section className="card pweek" aria-labelledby="pweek-title">
      <div className="pweek-head">
        <div>
          <h3 id="pweek-title">Protein this week</h3>
          <p className="muted small">Per person, one serving of each dish</p>
        </div>
        <p className="pweek-avg">
          <strong>{average} g</strong>
          <span>a day on average</span>
        </p>
      </div>

      <ul className="pweek-legend" aria-hidden="true">
        <li>
          <span className="lg-band" /> Adult guide {PROTEIN_GUIDE.low}–{PROTEIN_GUIDE.high} g
        </li>
        <li>
          <span className="lg-ok" /> Reaches it
        </li>
        <li>
          <span className="lg-low" /> Below
        </li>
      </ul>

      <div className="pweek-chart" role="list">
        <div className="pweek-plot" aria-hidden="true">
          <div className="pweek-band" style={{ bottom: pct(PROTEIN_GUIDE.low), height: `calc(${pct(PROTEIN_GUIDE.high)} - ${pct(PROTEIN_GUIDE.low)})` }} />
        </div>
        {days.map((d, i) => (
          <button
            key={d.date}
            role="listitem"
            className={`pweek-col${i === selected ? ' is-active' : ''}`}
            onClick={() => onSelect(i)}
            aria-label={`${WEEKDAYS_SHORT[d.weekday]}: about ${d.protein} g protein`}
          >
            <span className="pweek-bar-wrap">
              <span className={`pweek-bar${d.protein >= PROTEIN_GUIDE.low ? ' is-ok' : ''}`} style={{ height: pct(d.protein) }}>
                <span className="pweek-val">{d.protein}</span>
              </span>
            </span>
            <span className="pweek-day">{WEEKDAYS_SHORT[d.weekday]}</span>
          </button>
        ))}
      </div>

      <p className="muted small">
        {short === 0
          ? 'Every day reaches the adult guide.'
          : `${short} ${short === 1 ? 'day is' : 'days are'} below the adult guide. Turn on Protein focus in Family, or add curd, milk or a chana snack.`}{' '}
        Guide: ICMR-NIN 2020, about 46 g for women and 54 g for men a day. Children, older people, pregnant women and active people need different amounts. Approximate, not medical advice.
      </p>
    </section>
  );
}
