import { useState, type ReactNode } from 'react';
import {
  WEEKDAYS,
  WEEKDAYS_SHORT,
  cookMessage,
  dayMessage,
  formatDate,
  getDish,
  parseISODate,
  prepForDay,
  toISODate,
  weekMessage,
  whatsappLink,
  type DayPlan,
  type FamilyProfile,
  type Meal,
  type MealType,
  type WeekPlan,
} from '../engine';
import { copyText } from '../lib/clipboard';
import { DishPicture } from './DishPicture';
import { CopyIcon, FoodMark, MoonIcon, ShuffleIcon, SunIcon, SunriseIcon, SwapIcon, WhatsAppIcon } from './icons';

interface Props {
  plan: WeekPlan;
  profile: FamilyProfile;
  isSample: boolean;
  onSwap: (day: number, meal: number, item: number) => void;
  onShuffleDay: (day: number) => void;
  onNewWeek: () => void;
  onSetUp: () => void;
  onOpenDish: (id: string) => void;
  /** Present when the visitor can sign in with Google */
  onSignIn?: () => void;
  notify: (msg: string) => void;
}

const MEAL_ICON: Record<MealType, ReactNode> = {
  Breakfast: <SunriseIcon />,
  Lunch: <SunIcon size={18} />,
  Dinner: <MoonIcon size={18} />,
};

function mainItem(meal: Meal) {
  return meal.items.find((i) => i.role !== 'base') ?? meal.items[0];
}

/** Which meal is next, by the clock: before 10 breakfast, before 3 lunch, before 10 pm dinner. */
function nextMeal(now: Date): { meal: MealType; tomorrow: boolean } {
  const h = now.getHours();
  if (h < 10) return { meal: 'Breakfast', tomorrow: false };
  if (h < 15) return { meal: 'Lunch', tomorrow: false };
  if (h < 22) return { meal: 'Dinner', tomorrow: false };
  return { meal: 'Breakfast', tomorrow: true };
}

function greeting(now: Date): string {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function MenuView({ plan, profile, isSample, onSwap, onShuffleDay, onNewWeek, onSetUp, onOpenDish, onSignIn, notify }: Props) {
  const now = new Date();
  const todayIso = toISODate(now);
  const todayIndex = plan.days.findIndex((d) => d.date === todayIso);
  const [selected, setSelected] = useState(Math.max(0, todayIndex));
  const day = plan.days[Math.min(selected, plan.days.length - 1)];

  return (
    <div className="stack">
      {isSample && (
        <div className="sample-banner">
          <p>
            <strong>This is a sample menu for the Sharma family.</strong> Tell us about your family and we’ll plan your week.
          </p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={onSetUp}>
              Set up my family
            </button>
            {onSignIn && (
              <button className="btn btn-quiet" onClick={onSignIn}>
                I already have an account
              </button>
            )}
          </div>
        </div>
      )}

      <NextUp plan={plan} profile={profile} now={now} todayIndex={todayIndex} onOpenDish={onOpenDish} onPickDay={setSelected} />

      <div className="week-head">
        <div>
          <p className="eyebrow">Week of {formatDate(plan.startDate)}</p>
          <h1>{profile.familyName ? `${profile.familyName} family menu` : 'Your weekly menu'}</h1>
        </div>
        <button className="btn btn-quiet" onClick={onNewWeek}>
          <ShuffleIcon /> New week
        </button>
      </div>

      <nav className="day-strip" aria-label="Choose a day">
        {plan.days.map((d, i) => (
          <button
            key={d.date}
            className={`day-pill${i === selected ? ' is-active' : ''}${d.date === todayIso ? ' is-today' : ''}`}
            aria-pressed={i === selected}
            onClick={() => setSelected(i)}
          >
            <span className="day-pill-name">{WEEKDAYS_SHORT[d.weekday]}</span>
            <span className="day-pill-date">{parseISODate(d.date).getDate()}</span>
            <span className="day-pill-marks" aria-hidden="true">
              {d.isFast && <span className="dot dot-vrat" />}
              {d.nonVegAllowed && <span className="dot dot-nonveg" />}
              {d.worldDinner && <span className="dot dot-world" />}
            </span>
          </button>
        ))}
      </nav>

      <div key={day.date} className="fade-in stack">
        <DayDetail
          day={day}
          dayIndex={selected}
          isToday={day.date === todayIso}
          profile={profile}
          onSwap={onSwap}
          onShuffleDay={onShuffleDay}
          onOpenDish={onOpenDish}
          notify={notify}
        />
      </div>

      <WeekGlance plan={plan} selected={selected} onSelect={setSelected} />

      <div className="card share-week">
        <div>
          <h3>Share the whole week</h3>
          <p className="muted small">One message with every day’s main dishes.</p>
        </div>
        <a className="btn btn-wa" href={whatsappLink(weekMessage(plan, profile))} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon /> Share week
        </a>
      </div>
    </div>
  );
}

function NextUp({
  plan,
  profile,
  now,
  todayIndex,
  onOpenDish,
  onPickDay,
}: {
  plan: WeekPlan;
  profile: FamilyProfile;
  now: Date;
  todayIndex: number;
  onOpenDish: (id: string) => void;
  onPickDay: (i: number) => void;
}) {
  const next = nextMeal(now);
  const dayIndex = todayIndex < 0 ? 0 : Math.min(todayIndex + (next.tomorrow ? 1 : 0), plan.days.length - 1);
  const day = plan.days[dayIndex];
  const meal = day.meals.find((m) => m.type === next.meal) ?? day.meals[0];
  const main = mainItem(meal);
  if (!main) return null;
  const dish = getDish(main.dishId);
  const names = meal.items.map((i) => getDish(i.dishId).name).join(' · ');
  const when = todayIndex < 0 ? WEEKDAYS[day.weekday] : next.tomorrow ? 'Tomorrow' : 'Today';
  return (
    <section className={`next-up meal-${meal.type.toLowerCase()}`} aria-label="Next meal">
      <div className="next-text">
        <p className="next-greet">
          {greeting(now)}
          {profile.familyName ? `, ${profile.familyName} family` : ''}!
        </p>
        <p className="next-label">
          {when}’s {meal.type.toLowerCase()}
        </p>
        <h2 className="next-dish">{names}</h2>
        <div className="btn-row">
          <button className="btn btn-light" onClick={() => onOpenDish(dish.id)}>
            See recipe
          </button>
          <button className="btn btn-ghost-light" onClick={() => onPickDay(dayIndex)}>
            Full day
          </button>
        </div>
      </div>
      <button className="next-art" onClick={() => onOpenDish(dish.id)} aria-label={`Open ${dish.name}`}>
        <DishPicture dish={dish} size={112} />
      </button>
    </section>
  );
}

function DayDetail({
  day,
  dayIndex,
  isToday,
  profile,
  onSwap,
  onShuffleDay,
  onOpenDish,
  notify,
}: {
  day: DayPlan;
  dayIndex: number;
  isToday: boolean;
  profile: FamilyProfile;
  onSwap: Props['onSwap'];
  onShuffleDay: Props['onShuffleDay'];
  onOpenDish: Props['onOpenDish'];
  notify: Props['notify'];
}) {
  const prep = prepForDay(day);
  const night = prep.filter((p) => p.when === 'night');
  const morning = prep.filter((p) => p.when === 'morning');
  const familyText = dayMessage(day, profile);
  const cookText = cookMessage(day, profile);

  return (
    <section className="stack" aria-labelledby="day-title">
      <div className="day-title-row">
        <h2 id="day-title">
          {WEEKDAYS[day.weekday]}, {formatDate(day.date)}
        </h2>
        <div className="chips">
          {isToday && <span className="chip chip-today">Today</span>}
          {day.isFast && <span className="chip chip-vrat">Vrat day</span>}
          {day.nonVegAllowed && <span className="chip chip-nonveg">{profile.diet === 'Egg' ? 'Egg day' : 'Non-veg day'}</span>}
          {day.worldDinner && <span className="chip chip-world">World food night</span>}
          {day.weekday >= 5 && <span className="chip">Weekend</span>}
        </div>
      </div>

      {prep.length > 0 && (
        <div className="prep card">
          <h3>Plan ahead</h3>
          {night.length > 0 && (
            <div className="prep-group">
              <span className="prep-when">
                <MoonIcon /> Night before
              </span>
              <ul>
                {night.map((p) => (
                  <li key={p.dish.id + p.meal}>
                    <strong>{p.dish.name}</strong> · {p.note}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {morning.length > 0 && (
            <div className="prep-group">
              <span className="prep-when">
                <SunIcon /> Morning
              </span>
              <ul>
                {morning.map((p) => (
                  <li key={p.dish.id + p.meal}>
                    <strong>{p.dish.name}</strong> · {p.note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {day.meals.map((meal, m) => (
        <MealCard key={meal.type} meal={meal} onSwap={(i) => onSwap(dayIndex, m, i)} onOpenDish={onOpenDish} />
      ))}

      <div className="card share-day">
        <h3>Send this day’s menu</h3>
        <div className="btn-row">
          <a className="btn btn-wa" href={whatsappLink(familyText)} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon /> Family group
          </a>
          <a className="btn btn-wa-outline" href={whatsappLink(cookText)} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon /> Cook, in Hindi
          </a>
        </div>
        <div className="btn-row">
          <button
            className="btn btn-quiet"
            onClick={async () => notify((await copyText(cookText)) ? 'Hindi message copied' : 'Copying is blocked here. Open “See messages” and select the text.')}
          >
            <CopyIcon /> Copy Hindi message
          </button>
          <button className="btn btn-quiet" onClick={() => onShuffleDay(dayIndex)}>
            <ShuffleIcon /> Shuffle this day
          </button>
        </div>
        <details className="msg-preview">
          <summary>See messages</summary>
          <pre>{familyText}</pre>
          <pre lang="hi">{cookText}</pre>
        </details>
      </div>
    </section>
  );
}

function MealCard({ meal, onSwap, onOpenDish }: { meal: Meal; onSwap: (item: number) => void; onOpenDish: (id: string) => void }) {
  const dishes = meal.items.map((i) => getDish(i.dishId));
  const longest = Math.max(0, ...dishes.map((d) => d.cookTime));
  return (
    <article className={`card meal meal-${meal.type.toLowerCase()}`}>
      <header className="meal-head">
        <span className="meal-icon" aria-hidden="true">
          {MEAL_ICON[meal.type]}
        </span>
        <div className="meal-title">
          <h3>{meal.type}</h3>
          {meal.label !== meal.type && <span className="meal-label">{meal.label}</span>}
        </div>
        {longest > 0 && <span className="meal-time">⏱ {longest} min</span>}
      </header>
      {meal.items.length === 0 && <p className="muted">No dish fits all your rules for this meal. Try loosening a rule in Family.</p>}
      <ul className="dish-list">
        {meal.items.map((item, i) => {
          const d = dishes[i];
          const isBase = item.role === 'base';
          return (
            <li key={`${item.dishId}-${i}`} className={`dish-row pop-in${isBase ? ' is-base' : ''}`}>
              <button className="dish-open" onClick={() => onOpenDish(d.id)} aria-label={`${d.name}: see recipe and details`}>
                <DishPicture dish={d} size={isBase ? 44 : 58} />
                <span className="dish-text">
                  <span className="dish-name">
                    <FoodMark diet={d.diet} /> {d.name}
                  </span>
                  <span className="dish-hindi" lang="hi">
                    {d.hindi}
                  </span>
                  {!isBase && (
                    <span className="dish-meta">
                      {d.cookTime} min · {d.heaviness}
                      {d.region !== 'Pan-India' && d.region !== 'Modern' ? ` · ${d.region}` : ''}
                    </span>
                  )}
                </span>
              </button>
              <button className="icon-btn swap-btn" onClick={() => onSwap(i)} aria-label={`Swap ${d.name}`} title={`Swap ${d.name}`}>
                <SwapIcon />
              </button>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function WeekGlance({ plan, selected, onSelect }: { plan: WeekPlan; selected: number; onSelect: (i: number) => void }) {
  const mainOf = (meal: Meal) => {
    const item = mainItem(meal);
    return item ? getDish(item.dishId).name : '–';
  };
  return (
    <section className="card glance" aria-labelledby="glance-title">
      <h3 id="glance-title">Week at a glance</h3>
      <div className="glance-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Breakfast</th>
              <th scope="col">Lunch</th>
              <th scope="col">Dinner</th>
            </tr>
          </thead>
          <tbody>
            {plan.days.map((d, i) => (
              <tr key={d.date} className={i === selected ? 'is-active' : ''}>
                <th scope="row">
                  <button className="link-btn" onClick={() => onSelect(i)}>
                    {WEEKDAYS_SHORT[d.weekday]} {parseISODate(d.date).getDate()}
                  </button>
                  {d.isFast && <span className="dot dot-vrat" aria-label="Vrat day" />}
                </th>
                {d.meals.map((m) => (
                  <td key={m.type}>{mainOf(m)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
