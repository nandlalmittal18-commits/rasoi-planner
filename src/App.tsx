import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { generateWeek, randomSeed, regenerateDay, swapItem, toISODate, type FamilyProfile, type WeekPlan } from './engine';
import { DishLibrary } from './components/DishLibrary';
import { FamilyForm } from './components/FamilyForm';
import { GroceryView } from './components/GroceryView';
import { BookIcon, CalendarIcon, CartIcon, FamilyIcon, Logo } from './components/icons';
import { MenuView } from './components/MenuView';
import { BLANK_PROFILE, DIET_LABEL, SAMPLE_PROFILE } from './lib/sample';
import { storage } from './lib/storage';

type Tab = 'menu' | 'grocery' | 'dishes' | 'family';
const TABS: { key: Tab; label: string; icon: ReactNode }[] = [
  { key: 'menu', label: 'Menu', icon: <CalendarIcon /> },
  { key: 'grocery', label: 'Shopping', icon: <CartIcon /> },
  { key: 'dishes', label: 'Dishes', icon: <BookIcon /> },
  { key: 'family', label: 'Family', icon: <FamilyIcon /> },
];

function tabFromHash(): Tab {
  const h = window.location.hash.replace('#', '');
  return TABS.some((t) => t.key === h) ? (h as Tab) : 'menu';
}

function today(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** First load: the saved family and menu, or the sample family. An expired menu is replaced. */
function initialState() {
  const saved = storage.loadProfile();
  const profile = saved ?? SAMPLE_PROFILE;
  let plan = saved ? storage.loadPlan() : null;
  const lastDay = plan?.days[plan.days.length - 1]?.date;
  if (!plan || !lastDay || lastDay < toISODate(today())) {
    plan = generateWeek(profile, today(), randomSeed());
    if (saved) storage.savePlan(plan);
  }
  return { profile, plan, isSample: !saved };
}

export default function App() {
  const [init] = useState(initialState);
  const [profile, setProfile] = useState<FamilyProfile>(init.profile);
  const [plan, setPlanState] = useState<WeekPlan>(init.plan);
  const [isSample, setIsSample] = useState(init.isSample);
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (t: Tab) => {
    if (window.location.hash !== `#${t}`) window.location.hash = t;
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3200);
  }, []);

  const setPlan = (p: WeekPlan, sample = isSample) => {
    setPlanState(p);
    if (!sample) storage.savePlan(p);
  };

  const onSwap = (d: number, m: number, i: number) => {
    const next = swapItem(plan, profile, d, m, i, randomSeed());
    if (next === plan) notify('No other dish fits your family’s rules here');
    else setPlan(next);
  };

  const onSaveProfile = (p: FamilyProfile) => {
    storage.saveProfile(p);
    setProfile(p);
    setIsSample(false);
    setPlan(generateWeek(p, today(), randomSeed()), false);
    go('menu');
    notify(p.familyName ? `New menu ready for the ${p.familyName} family` : 'Your new menu is ready');
  };

  const onToggleDislike = (id: string) => {
    const dislikes = profile.dislikes.includes(id) ? profile.dislikes.filter((x) => x !== id) : [...profile.dislikes, id];
    const next = { ...profile, dislikes };
    setProfile(next);
    if (!isSample) storage.saveProfile(next);
    notify(dislikes.includes(id) ? 'We won’t suggest that dish in new menus or swaps' : 'That dish can be suggested again');
  };

  const onReset = () => {
    storage.clearAll();
    setProfile(SAMPLE_PROFILE);
    setIsSample(true);
    setPlanState(generateWeek(SAMPLE_PROFILE, today(), randomSeed()));
    go('family');
    notify('Your family was deleted from this phone');
  };

  return (
    <div className="app">
      <header className="topbar">
        <Logo />
        <div className="brand">
          <span className="brand-name">Rasoi Planner</span>
          <span className="brand-sub">
            {isSample ? 'Sample family' : profile.familyName ? `${profile.familyName} family` : 'Your family'} · {DIET_LABEL[profile.diet]}
            {profile.jain ? ' · Jain' : ''}
          </span>
        </div>
      </header>

      <main className="content" id="main">
        {tab === 'menu' && (
          <MenuView
            plan={plan}
            profile={profile}
            isSample={isSample}
            onSwap={onSwap}
            onShuffleDay={(d) => setPlan(regenerateDay(plan, profile, d, randomSeed()))}
            onNewWeek={() => {
              setPlan(generateWeek(profile, today(), randomSeed()));
              notify('Fresh menu for the week');
            }}
            onSetUp={() => go('family')}
            notify={notify}
          />
        )}
        {tab === 'grocery' && <GroceryView key={plan.createdAt} plan={plan} notify={notify} />}
        {tab === 'dishes' && <DishLibrary profile={profile} onToggleDislike={onToggleDislike} />}
        {tab === 'family' && (
          <FamilyForm
            key={isSample ? 'new' : 'edit'}
            initial={isSample ? BLANK_PROFILE : profile}
            isNew={isSample}
            onSave={onSaveProfile}
            onReset={onReset}
          />
        )}
      </main>

      <nav className="tabbar" aria-label="Sections">
        {TABS.map((t) => (
          <button key={t.key} className={`tab${tab === t.key ? ' is-active' : ''}`} aria-current={tab === t.key ? 'page' : undefined} onClick={() => go(t.key)}>
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <div className={`toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
