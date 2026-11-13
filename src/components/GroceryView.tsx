import { useMemo, useState } from 'react';
import { GROCERY_GROUPS, groceryList, groceryMessage, whatsappLink, type WeekPlan } from '../engine';
import { copyText } from '../lib/clipboard';
import { storage } from '../lib/storage';
import { CopyIcon, WhatsAppIcon } from './icons';

export function GroceryView({ plan, notify }: { plan: WeekPlan; notify: (msg: string) => void }) {
  const items = useMemo(() => groceryList(plan), [plan]);
  const planKey = plan.createdAt;
  const [ticked, setTicked] = useState(() => storage.loadTicked(planKey));
  const left = items.filter((i) => !ticked.has(i.key)).length;

  const toggle = (key: string) => {
    const next = new Set(ticked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setTicked(next);
    storage.saveTicked(planKey, next);
  };

  const message = groceryMessage(items, ticked);

  return (
    <div className="stack">
      <div className="week-head">
        <div>
          <p className="eyebrow">For this week’s menu</p>
          <h1>Shopping list</h1>
        </div>
      </div>

      <div className="card grocery-summary">
        <p>
          <strong className="big-num">{left}</strong> of {items.length} items still to buy
        </p>
        <div className="btn-row">
          <a className="btn btn-wa" href={whatsappLink(message)} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon /> Send list
          </a>
          <button className="btn btn-quiet" onClick={async () => notify((await copyText(message)) ? 'List copied' : 'Copying is blocked here')}>
            <CopyIcon /> Copy
          </button>
          {ticked.size > 0 && (
            <button
              className="btn btn-quiet"
              onClick={() => {
                setTicked(new Set());
                storage.saveTicked(planKey, new Set());
              }}
            >
              Untick all
            </button>
          )}
        </div>
        <p className="muted small">Main ingredients only. Tick what you already have at home; ticked items are left out of the list you send.</p>
      </div>

      {GROCERY_GROUPS.map((group) => {
        const rows = items.filter((i) => i.group === group);
        if (!rows.length) return null;
        return (
          <section key={group} className="card grocery-group" aria-labelledby={`g-${group}`}>
            <h3 id={`g-${group}`}>{group}</h3>
            <ul>
              {rows.map((i) => (
                <li key={i.key}>
                  <label className={`tick${ticked.has(i.key) ? ' is-ticked' : ''}`}>
                    <input type="checkbox" id={`tick-${i.key}`} checked={ticked.has(i.key)} onChange={() => toggle(i.key)} />
                    <span className="tick-name">{i.name}</span>
                    <span className="tick-for" title={i.dishes.join(', ')}>
                      {i.dishes.length === 1 ? i.dishes[0] : `${i.dishes.length} dishes`}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
