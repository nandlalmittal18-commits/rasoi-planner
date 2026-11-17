import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { MEAL_NAME, WEEKDAYS_SHORT, generateWeek, getDish, isPlanUsable, randomSeed, regenerateDay, setMainDish, swapItem, toISODate, type FamilyProfile, type WeekPlan } from './engine';
import { AccountCard, type Account } from './components/AccountCard';
import { DishLibrary } from './components/DishLibrary';
import { DishSheet } from './components/DishSheet';
import { FamilyForm } from './components/FamilyForm';
import { GroceryView } from './components/GroceryView';
import { BookIcon, CalendarIcon, CartIcon, FamilyIcon, Logo } from './components/icons';
import { MenuView } from './components/MenuView';
import { BLANK_PROFILE, SAMPLE_PROFILE } from './lib/sample';
import { storage, type SyncState } from './lib/storage';
import { signInWithGoogle, signOut, supabase } from './lib/supabase';

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

/** A saved menu needs replacing when its week is over or it mentions a dish that no longer exists. */
function isExpired(plan: WeekPlan | null): boolean {
  if (!isPlanUsable(plan)) return true;
  const lastDay = plan.days[plan.days.length - 1]?.date;
  return !lastDay || lastDay < toISODate(today());
}

/** First load: the family and menu kept on this phone, or the sample family. An expired menu is replaced. */
function initialState() {
  const saved = storage.loadProfile();
  const profile = saved ?? SAMPLE_PROFILE;
  let plan = saved ? storage.loadPlan() : null;
  if (isExpired(plan)) {
    plan = generateWeek(profile, today(), randomSeed());
    if (saved) storage.savePlan(plan);
  }
  return { profile, plan: plan!, isSample: !saved };
}

function toAccount(u: User): Account {
  const meta = u.user_metadata ?? {};
  return { id: u.id, email: u.email ?? '', name: (meta.full_name as string) ?? (meta.name as string) ?? '' };
}

const online = supabase() !== null;

export default function App() {
  const [init] = useState(initialState);
  const [profile, setProfile] = useState<FamilyProfile>(init.profile);
  const [plan, setPlanState] = useState<WeekPlan>(init.plan);
  const [isSample, setIsSample] = useState(init.isSample);
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [toast, setToast] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [authReady, setAuthReady] = useState(!online);
  const [sync, setSync] = useState<SyncState>(storage.getSync());
  const [openDish, setOpenDish] = useState<string | null>(null);
  const closeDish = useCallback(() => setOpenDish(null), []);
  const toastTimer = useRef<number | undefined>(undefined);
  const signedInAs = useRef<string | null>(null);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = useCallback((t: Tab) => {
    if (window.location.hash !== `#${t}`) window.location.hash = t;
    setTab(t);
    window.scrollTo({ top: 0 });
  }, []);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3600);
  }, []);

  useEffect(() => storage.onError(notify), [notify]);
  useEffect(() => storage.onSync(setSync), []);

  // ---- Google sign-in: load the family's saved data whenever someone signs in.
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;

    const params = new URLSearchParams(window.location.search);
    const failed = params.get('error_description');
    if (failed) {
      notify(`Google sign-in didn’t work: ${failed}`);
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }

    const handleUser = async (user: User | null) => {
      const id = user?.id ?? null;
      if (id === signedInAs.current) {
        setAuthReady(true);
        return;
      }
      signedInAs.current = id;
      storage.setUser(id);
      setAccount(user ? toAccount(user) : null);
      if (!user) {
        setAuthReady(true);
        return;
      }
      try {
        const saved = await storage.pullFromCloud();
        if (saved) {
          // This Google account already has a family: show it (on any phone).
          let next = saved.plan;
          if (isExpired(next)) {
            next = generateWeek(saved.profile, today(), randomSeed());
            storage.savePlan(next);
          }
          setProfile(saved.profile);
          setIsSample(false);
          setPlanState(next!);
        } else if (storage.loadProfile()) {
          // First sign-in on a phone that already has a family: copy it to the account.
          storage.pushAllToCloud();
          notify('Your family is now saved to your Google account');
        } else {
          go('family');
          notify('Signed in. Now tell us about your family.');
        }
      } catch {
        notify('Couldn’t load your saved menu. Check your internet and open the app again.');
      }
      setAuthReady(true);
    };

    // Supabase asks that other Supabase calls are not made inside this callback, hence the setTimeout.
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => void handleUser(session?.user ?? null), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [go, notify]);

  const onSignIn = async () => {
    const error = await signInWithGoogle();
    if (error) notify(error);
  };

  const onSignOut = async () => {
    await signOut();
    signedInAs.current = null;
    storage.setUser(null);
    storage.clearLocal();
    setAccount(null);
    setProfile(SAMPLE_PROFILE);
    setIsSample(true);
    setPlanState(generateWeek(SAMPLE_PROFILE, today(), randomSeed()));
    go('menu');
    notify('Signed out. Your family is safe in your Google account.');
  };

  const setPlan = (p: WeekPlan, sample = isSample) => {
    setPlanState(p);
    if (!sample) storage.savePlan(p);
  };

  const onSwap = (d: number, m: number, i: number) => {
    const next = swapItem(plan, profile, d, m, i, randomSeed());
    if (next === plan) notify('No other dish fits your family’s rules here');
    else setPlan(next);
  };

  const onChoose = (d: number, m: number, dishId: string) => {
    const next = setMainDish(plan, profile, d, m, dishId, randomSeed());
    if (next === plan) return notify('That dish doesn’t fit your family’s food rules here');
    setPlan(next);
    const day = next.days[d];
    notify(`${WEEKDAYS_SHORT[day.weekday]} ${MEAL_NAME[day.meals[m].type].toLowerCase()}: ${getDish(dishId).name}`);
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
    notify(account ? 'Your family was deleted from this phone and your account' : 'Your family was deleted from this phone');
  };

  const accountCard = online ? (
    <AccountCard
      account={account}
      ready={authReady}
      sync={sync}
      onSignIn={onSignIn}
      onSignOut={onSignOut}
      onRetry={() => storage.pushAllToCloud()}
    />
  ) : null;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
        <Logo />
        <div className="brand">
          <span className="brand-name">Rasoi Planner</span>
          <span className="brand-sub">
            {isSample ? 'Sample family' : profile.familyName ? `${profile.familyName} family` : 'Your family'} · Pure veg
            {profile.jain ? ' · Jain' : ''}
            {account && !isSample ? ' · Saved online' : ''}
          </span>
        </div>
        <nav className="topnav" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.key} className={`topnav-link${tab === t.key ? ' is-active' : ''}`} aria-current={tab === t.key ? 'page' : undefined} onClick={() => go(t.key)}>
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        </div>
      </header>

      <main className={`content content-${tab}`} id="main">
        {tab === 'menu' && (
          <MenuView
            plan={plan}
            profile={profile}
            isSample={isSample}
            onSwap={onSwap}
            onChoose={onChoose}
            onShuffleDay={(d) => setPlan(regenerateDay(plan, profile, d, randomSeed()))}
            onNewWeek={() => {
              setPlan(generateWeek(profile, today(), randomSeed()));
              notify('Fresh menu for the week');
            }}
            onSetUp={() => go('family')}
            onOpenDish={setOpenDish}
            onSignIn={online && authReady && !account ? onSignIn : undefined}
            notify={notify}
          />
        )}
        {tab === 'grocery' && <GroceryView key={plan.createdAt} plan={plan} notify={notify} />}
        {tab === 'dishes' && <DishLibrary profile={profile} onToggleDislike={onToggleDislike} onOpenDish={setOpenDish} />}
        {tab === 'family' && (
          <FamilyForm
            key={isSample ? 'new' : `edit-${account?.id ?? 'phone'}`}
            initial={isSample ? BLANK_PROFILE : profile}
            isNew={isSample}
            account={accountCard}
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

      <DishSheet dishId={openDish} onClose={closeDish} notify={notify} />

      <div className={`toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
