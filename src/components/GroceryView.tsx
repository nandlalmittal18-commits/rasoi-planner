import { useMemo, useState } from 'react';
import { GROCERY_GROUPS, groceryList, groceryMessage, servingsFor, whatsappLink, type FamilyProfile, type WeekPlan } from '../engine';
import { copyText } from '../lib/clipboard';
import { storage } from '../lib/storage';
import { CopyIcon, WhatsAppIcon } from './icons';

/** Grocery apps with a search page we can open for one item. */
const SHOPS = [
  { key: 'blinkit', label: 'Blinkit', url: (q: string) => `https://blinkit.com/s/?q=${encodeURIComponent(q)}` },
  { key: 'zepto', label: 'Zepto', url: (q: string) => `https://www.zepto.com/search?query=${encodeURIComponent(q)}` },
  { key: 'bigbasket', label: 'BigBasket', url: (q: string) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}` },
];

function peopleText(profile: FamilyProfile): string {
  const adults = profile.adults ?? 2;
  const kids = profile.kids ?? (profile.hasKids ? 1 : 0);
  return `${adults} ${adults === 1 ? 'adult' : 'adults'}${kids ? ` and ${kids} ${kids === 1 ? 'child' : 'children'}` : ''}`;
}

export function GroceryView({ plan, profile, notify, onEditFamily }: { plan: WeekPlan; profile: FamilyProfile; notify: (msg: string) => void; onEditFamily: () => void }) {
  const servings = servingsFor(profile);
  const items = useMemo(() => groceryList(plan, servings), [plan, servings]);
  const [shop, setShop] = useState(() => storage.loadShopApp() ?? 'blinkit');
  const shopInfo = SHOPS.find((x) => x.key === shop) ?? SHOPS[0];
  const pickShop = (k: string) => {
    setShop(k);
    storage.saveShopApp(k);
  };
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
        <p className="muted small">
          Rough amounts for {peopleText(profile)}, one serving each per dish (
          <button type="button" className="link-btn" onClick={onEditFamily}>
            change
          </button>
          ). Main ingredients only; spices and oil are left out. Tick what you already have at home; ticked items are left out of the list you send.
        </p>
        <div className="shop-pick">
          <span className="small">Order from</span>
          <div className="seg" role="radiogroup" aria-label="Order from">
            {SHOPS.map((x) => (
              <button type="button" key={x.key} role="radio" aria-checked={shop === x.key} className={`seg-btn${shop === x.key ? ' is-on' : ''}`} onClick={() => pickShop(x.key)}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {GROCERY_GROUPS.map((group) => {
        const rows = items.filter((i) => i.group === group);
        if (!rows.length) return null;
        return (
          <section key={group} className="card grocery-group" aria-labelledby={`g-${group}`}>
            <h3 id={`g-${group}`}>{group}</h3>
            <ul>
              {rows.map((i) => (
                <li key={i.key} className="grocery-row">
                  <label className={`tick${ticked.has(i.key) ? ' is-ticked' : ''}`}>
                    <input type="checkbox" id={`tick-${i.key}`} checked={ticked.has(i.key)} onChange={() => toggle(i.key)} />
                    <span className="tick-name">
                      {i.name}
                      {i.amount && <span className="tick-amount">{i.amount}</span>}
                    </span>
                    <span className="tick-for" title={i.dishes.join(', ')}>
                      {i.dishes.length === 1 ? i.dishes[0] : `${i.dishes.length} dishes`}
                    </span>
                  </label>
                  {!ticked.has(i.key) && (
                    <a className="buy-link" href={shopInfo.url(i.name)} target="_blank" rel="noopener noreferrer" aria-label={`Buy ${i.name} on ${shopInfo.label}`}>
                      Buy
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
