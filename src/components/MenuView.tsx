import { useCallback, useState, type ReactNode } from 'react';
import {
  MEAL_NAME,
  dayNote,
  MEAL_TYPES,
  WEEKDAYS,
  WEEKDAYS_SHORT,
  cookMessage,
  dayMessage,
  dayNutrition,
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
import { shareWeekImage } from '../lib/weekImage';
import { DishCard } from './DishCard';
import { DishPicker, type PickTarget } from './DishPicker';
import { RateButtons } from './RateButtons';
import { PartyCard, PartyPlanner } from './Party';
import { FestivalCard, FestivalNudge, FestivalSheet, type SaveFestival } from './Festivals';
import { DishPicture } from './DishPicture';
import { ProteinWeek } from './ProteinWeek';
import { ChaiIcon, CopyIcon, EditIcon, ImageIcon, MoonIcon, ShuffleIcon, SunIcon, SunriseIcon, SwapIcon, WhatsAppIcon } from './icons';

interface Props {
  plan: WeekPlan;
  profile: FamilyProfile;
  isSample: boolean;
  onSwap: (day: number, meal: number, item: number) => void;
  /** Thumbs up (1), down (-1) or clear (0) for a dish */
  onRate: (dishId: string, v: 1 | -1 | 0) => void;
  /** Save which days of a festival the family keeps */
  onPlanFestival: SaveFestival;
  /** A person picked this dish as the main dish of a meal */
  onChoose: (day: number, meal: number, dishId: string) => void;
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
  Snack: <ChaiIcon />,
  Dinner: <MoonIcon size={18} />,
};

function mainItem(meal: Meal) {
  return meal.items.find((i) => i.role !== 'base') ?? meal.items[0];
}

/** Which meal is next, by the clock: before 10 breakfast, before 3 lunch, before 6 pm snack, before 10 pm dinner. */
function nextMeal(now: Date, hasSnack: boolean): { meal: MealType; tomorrow: boolean } {
  const h = now.getHours();
  if (h < 10) return { meal: 'Breakfast', tomorrow: false };
  if (h < 15) return { meal: 'Lunch', tomorrow: false };
  if (h < 18 && hasSnack) return { meal: 'Snack', tomorrow: false };
  if (h < 22) return { meal: 'Dinner', tomorrow: false };
  return { meal: 'Breakfast', tomorrow: true };
}

function greeting(now: Date): string {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function MenuView({ plan, profile, isSample, onSwap, onChoose, onRate, onPlanFestival, onShuffleDay, onNewWeek, onSetUp, onOpenDish, onSignIn, notify }: Props) {
  const now = new Date();
  const todayIso = toISODate(now);
  const todayIndex = plan.days.findIndex((d) => d.date === todayIso);
  const [selected, setSelected] = useState(Math.max(0, todayIndex));
  const [picking, setPicking] = useState<PickTarget | null>(null);
  const closePicker = useCallback(() => setPicking(null), []);
  const [making, setMaking] = useState(false);
  const [festivalOpen, setFestivalOpen] = useState<string | null>(null);
  const [partyOpen, setPartyOpen] = useState(false);
  const closeParty = useCallback(() => setPartyOpen(false), []);
  const closeFestival = useCallback(() => setFestivalOpen(null), []);

  const sharePicture = async () => {
    setMaking(true);
    try {
      const result = await shareWeekImage(plan, profile);
      if (result === 'copied') notify('Picture copied. Open WhatsApp, pick a chat and press Ctrl + V to paste it.');
      if (result === 'downloaded') notify('Picture saved to your downloads. Attach it in WhatsApp.');
    } catch {
      notify('Could not make the picture. Please try again.');
    } finally {
      setMaking(false);
    }
  };
  const day = plan.days[Math.min(selected, plan.days.length - 1)];

  return (
    <div className="stack menu-page">

      <NextUp plan={plan} profile={profile} now={now} todayIndex={todayIndex} onOpenDish={onOpenDish} onPickDay={setSelected} />

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

      <div className="menu-grid">
        <div className="menu-main stack">

        <div className="week-head">
          <div>
            <p className="eyebrow">Week of {formatDate(plan.startDate)}</p>
            <h1>{profile.familyName ? `${profile.familyName} family menu` : 'Your weekly menu'}</h1>
          </div>
          <button className="btn btn-quiet" onClick={onNewWeek}>
            <ShuffleIcon /> New week
          </button>
        </div>

        <FestivalNudge plan={plan} profile={profile} today={todayIso} onOpen={setFestivalOpen} />

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
                {(d.isFast || d.festival) && <span className="dot dot-vrat" />}
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
            onRate={onRate}
            onShuffleDay={onShuffleDay}
            onOpenDish={onOpenDish}
            notify={notify}
          />
        </div>

          <WeekGlance plan={plan} selected={selected} onSelect={setSelected} onChange={(day, meal) => setPicking({ day, meal })} />
        </div>

        <aside className="menu-side stack" aria-label="This week">
          <ProteinWeek plan={plan} selected={selected} onSelect={setSelected} />
          <FestivalCard profile={profile} today={todayIso} onOpen={setFestivalOpen} />
          <PartyCard onOpen={() => setPartyOpen(true)} />
          <div className="card share-week">
            <div>
              <h3>Share the whole week</h3>
              <p className="muted small">Send it as a message, or as a picture of the full table.</p>
            </div>
            <div className="share-week-actions">
              <a className="btn btn-wa" href={whatsappLink(weekMessage(plan, profile))} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon /> Send as message
              </a>
              <button type="button" className="btn btn-quiet" onClick={sharePicture} disabled={making}>
                <ImageIcon /> {making ? 'Making picture…' : 'Share as picture'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      <PartyPlanner open={partyOpen} profile={profile} onClose={closeParty} onOpenDish={onOpenDish} />

      <FestivalSheet
        festivalId={festivalOpen}
        profile={profile}
        today={todayIso}
        onClose={closeFestival}
        onSave={(id, offered, chosen, rule) => {
          setFestivalOpen(null);
          onPlanFestival(id, offered, chosen, rule);
        }}
      />

      <DishPicker
        target={picking}
        plan={plan}
        profile={profile}
        onClose={closePicker}
        onPick={(t, dishId) => {
          setPicking(null);
          onChoose(t.day, t.meal, dishId);
        }}
        onSurprise={(t) => {
          setPicking(null);
          const meal = plan.days[t.day].meals[t.meal];
          onSwap(t.day, t.meal, Math.max(0, meal.items.findIndex((i) => i.role !== 'base')));
        }}
      />
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
  const next = nextMeal(now, plan.days.some((d) => d.meals.some((m) => m.type === 'Snack')));
  const dayIndex = todayIndex < 0 ? 0 : Math.min(todayIndex + (next.tomorrow ? 1 : 0), plan.days.length - 1);
  const day = plan.days[dayIndex];
  const meal = day.meals.find((m) => m.type === next.meal) ?? day.meals[0];
  const main = mainItem(meal);
  if (!main) return null;
  const dish = getDish(main.dishId);
  // The main dish first, then the others (roti/rice last), at most three plates.
  const plates = [main, ...meal.items.filter((i) => i !== main && i.role !== 'base'), ...meal.items.filter((i) => i !== main && i.role === 'base')]
    .slice(0, 3)
    .map((i) => getDish(i.dishId));
  const names = meal.items.map((i) => getDish(i.dishId).name);
  const when = todayIndex < 0 ? WEEKDAYS[day.weekday] : next.tomorrow ? 'Tomorrow' : 'Today';
  const longest = Math.max(...meal.items.map((i) => getDish(i.dishId).cookTime));
  return (
    <section className={`hero meal-${meal.type.toLowerCase()}`} aria-label="Next meal">
      <div className="hero-inner">
        <div className="hero-text">
          <p className="hero-greet">
            {greeting(now)}
            {profile.familyName ? `, ${profile.familyName} family` : ''}
          </p>
          <p className="hero-when">
            {when}’s {MEAL_NAME[meal.type].toLowerCase()}, ready in about {longest} min
          </p>
          <h2 className="hero-dish">{names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0]}</h2>
          <div className="btn-row">
            <button className="btn btn-light" onClick={() => onOpenDish(dish.id)}>
              How to make {dish.name}
            </button>
            <button className="btn btn-ghost-light" onClick={() => onPickDay(dayIndex)}>
              See the full day
            </button>
          </div>
        </div>
        <div className={`hero-plates plates-${plates.length}`}>
          {plates.map((d, i) => (
            <button key={d.id} className={`plate plate-${i}`} onClick={() => onOpenDish(d.id)} aria-label={`Open ${d.name}`}>
              <DishPicture dish={d} size={i === 0 ? 260 : 130} cover />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function DayDetail({
  day,
  dayIndex,
  isToday,
  profile,
  onSwap,
  onRate,
  onShuffleDay,
  onOpenDish,
  notify,
}: {
  day: DayPlan;
  dayIndex: number;
  isToday: boolean;
  profile: FamilyProfile;
  onSwap: Props['onSwap'];
  onRate: Props['onRate'];
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
          {dayNote(day) && <span className="chip chip-vrat">{dayNote(day) === 'Vrat' ? 'Vrat day' : dayNote(day)}</span>}
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
        <MealCard key={meal.type} meal={meal} ratings={profile.ratings} onRate={onRate} onSwap={(i) => onSwap(dayIndex, m, i)} onOpenDish={onOpenDish} />
      ))}

      <DayNutrition day={day} />

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

function MealCard({
  meal,
  ratings,
  onSwap,
  onRate,
  onOpenDish,
}: {
  meal: Meal;
  ratings?: FamilyProfile['ratings'];
  onSwap: (item: number) => void;
  onRate: (dishId: string, v: 1 | -1 | 0) => void;
  onOpenDish: (id: string) => void;
}) {
  const dishes = meal.items.map((i) => getDish(i.dishId));
  const longest = Math.max(0, ...dishes.map((d) => d.cookTime));
  const mains = meal.items.map((item, i) => ({ item, i, d: dishes[i] })).filter((x) => x.item.role !== 'base');
  const bases = meal.items.map((item, i) => ({ item, i, d: dishes[i] })).filter((x) => x.item.role === 'base');
  return (
    <section className={`meal meal-${meal.type.toLowerCase()}`} aria-label={MEAL_NAME[meal.type]}>
      <header className="meal-head">
        <span className="meal-icon" aria-hidden="true">
          {MEAL_ICON[meal.type]}
        </span>
        <div className="meal-title">
          <h3>{MEAL_NAME[meal.type]}</h3>
          <span className="meal-label">
            {meal.label !== meal.type ? `${meal.label}, ` : ''}about {longest} min
          </span>
        </div>
      </header>
      {meal.items.length === 0 && <p className="muted">No dish fits all your rules for this meal. Try loosening a rule in Family.</p>}
      <div className="dcard-grid">
        {mains.map(({ i, d }) => (
          <DishCard
            key={`${d.id}-${i}`}
            dish={d}
            onOpen={onOpenDish}
            action={
              <button className="photo-btn" onClick={() => onSwap(i)} aria-label={`Swap ${d.name}`} title={`Swap ${d.name}`}>
                <SwapIcon /> Swap
              </button>
            }
            note={<RateButtons name={d.name} value={ratings?.[d.id]} onRate={(v) => onRate(d.id, v)} />}
          />
        ))}
      </div>
      {bases.length > 0 && (
        <p className="served-with">
          <span>Served with</span>
          {bases.map(({ i, d }) => (
            <span key={`${d.id}-${i}`} className="base-chip">
              <button className="base-open" onClick={() => onOpenDish(d.id)}>
                <DishPicture dish={d} size={32} /> {d.name}
              </button>
              <button className="base-swap" onClick={() => onSwap(i)} aria-label={`Swap ${d.name}`} title={`Swap ${d.name}`}>
                <SwapIcon />
              </button>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

function WeekGlance({
  plan,
  selected,
  onSelect,
  onChange,
}: {
  plan: WeekPlan;
  selected: number;
  onSelect: (i: number) => void;
  /** Open the dish chooser for one meal */
  onChange: (day: number, meal: number) => void;
}) {
  // Columns follow the meals in the plan (the evening snack only if the family plans one).
  const types = MEAL_TYPES.filter((t) => plan.days.some((d) => d.meals.some((m) => m.type === t)));
  return (
    <section className="card glance" aria-labelledby="glance-title">
      <div className="glance-head">
        <h3 id="glance-title">Week at a glance</h3>
        <p className="muted small">Tap a dish to change it.</p>
      </div>
      <div className="glance-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Day</th>
              {types.map((t) => (
                <th key={t} scope="col">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plan.days.map((d, i) => (
              <tr key={d.date} className={i === selected ? 'is-active' : ''}>
                <th scope="row">
                  <button className="link-btn" onClick={() => onSelect(i)}>
                    {WEEKDAYS_SHORT[d.weekday]} {parseISODate(d.date).getDate()}
                  </button>
                  {(d.isFast || d.festival) && <span className="dot dot-vrat" aria-label={dayNote(d)} title={dayNote(d)} />}
                </th>
                {types.map((t) => {
                  const m = d.meals.findIndex((x) => x.type === t);
                  const item = m >= 0 ? mainItem(d.meals[m]) : undefined;
                  if (!item) return <td key={t}>–</td>;
                  const name = getDish(item.dishId).name;
                  return (
                    <td key={t}>
                      <button
                        type="button"
                        className="glance-dish"
                        onClick={() => onChange(i, m)}
                        aria-label={`${WEEKDAYS_SHORT[d.weekday]} ${MEAL_NAME[t]}: ${name}. Change`}
                      >
                        <span>{name}</span>
                        <EditIcon />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Rough protein and calories for one person if they have one serving of every dish today. */
function DayNutrition({ day }: { day: DayPlan }) {
  const t = dayNutrition(day);
  if (!t.kcal) return null;
  return (
    <p className="day-nutri">
      <span>
        <strong>{t.protein} g</strong> protein
      </span>
      <span>
        <strong>{t.kcal.toLocaleString('en-IN')}</strong> kcal
      </span>
      <span className="muted">for one person, one serving of each dish</span>
    </p>
  );
}
