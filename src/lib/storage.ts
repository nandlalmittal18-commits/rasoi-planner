// Every read and write of family data goes through this file.
//
// - Always: a copy is kept in this phone's browser, so the app opens instantly
//   and keeps working without internet.
// - When the family is signed in with Google: every change is also saved to
//   Supabase (tables in supabase/schema.sql), so it works on any phone and the
//   WhatsApp bot can read it later.

import type { FamilyProfile, WeekPlan } from '../engine';
import { supabase } from './supabase';

const KEYS = {
  profile: 'rasoi.profile.v1',
  plan: 'rasoi.plan.v1',
  grocery: 'rasoi.grocery.v1',
  /** Old Wikipedia photo list; no longer used, cleared on start */
  photos: 'rasoi.photos.v1',
};


interface Ticked {
  plan: string;
  keys: string[];
}

// Some browsers block storage (private mode, embedded views). Fall back to memory.
const memory = new Map<string, string>();

function read<T>(key: string): T | null {
  let raw: string | null | undefined;
  try {
    raw = localStorage.getItem(key);
  } catch {
    raw = memory.get(key);
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    localStorage.setItem(key, raw);
  } catch {
    /* memory copy is enough for this visit */
  }
}

function remove(key: string) {
  memory.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// The app used to keep a copy of Wikipedia photo links on the phone. Clear it.
remove(KEYS.photos);

/** Profiles saved before a setting existed get its default here. */
function withDefaults(p: FamilyProfile): FamilyProfile {
  return { ...p, diet: 'Veg', nonVegDays: [], worldMealsPerWeek: p.worldMealsPerWeek ?? 1, eveningSnack: p.eveningSnack ?? true, proteinFocus: p.proteinFocus ?? false };
}

// ---------------------------------------------------------------- online copy

/** Whether the online copy is up to date. Shown on the Family screen. */
export type SyncState = { state: 'idle' | 'saving' | 'saved' | 'error'; message?: string };

let userId: string | null = null;
let reportError: (message: string) => void = () => {};
let sync: SyncState = { state: 'idle' };
const syncListeners = new Set<(s: SyncState) => void>();
let pending = 0;
let failedThisRound = false;
// Online writes run one after another, so a quick swap-swap can't arrive out of order.
let queue: Promise<unknown> = Promise.resolve();

function setSync(next: SyncState) {
  sync = next;
  syncListeners.forEach((fn) => fn(next));
}

function cloud(task: (uid: string) => PromiseLike<{ error: { message: string } | null }>) {
  const uid = userId;
  if (!uid || !supabase()) return;
  if (pending === 0) failedThisRound = false;
  pending++;
  if (sync.state !== 'error') setSync({ state: 'saving' });
  const fail = (message: string) => {
    if (!failedThisRound) reportError(`Couldn’t save online: ${message}. Your changes are kept on this phone.`);
    failedThisRound = true;
    setSync({ state: 'error', message });
  };
  queue = queue
    .then(() => task(uid))
    .then((res) => {
      if (res.error) fail(res.error.message);
    })
    .catch((e: unknown) => fail(e instanceof Error ? e.message : 'no internet connection'))
    .finally(() => {
      pending--;
      if (pending === 0 && !failedThisRound) setSync({ state: 'saved' });
    });
}

const db = () => supabase()!;
const now = () => new Date().toISOString();

export const storage = {
  /** Called when someone signs in (their id) or out (null). */
  setUser(id: string | null) {
    userId = id;
    setSync({ state: 'idle' });
  },
  getSync: () => sync,
  /** Listen for changes to the online-save status. Returns a function that stops listening. */
  onSync(fn: (s: SyncState) => void) {
    syncListeners.add(fn);
    return () => {
      syncListeners.delete(fn);
    };
  },
  onError(fn: (message: string) => void) {
    reportError = fn;
  },

  loadProfile: () => {
    const saved = read<FamilyProfile>(KEYS.profile);
    return saved ? withDefaults(saved) : null;
  },
  saveProfile(p: FamilyProfile) {
    write(KEYS.profile, p);
    cloud((uid) => db().from('families').upsert({ user_id: uid, profile: p, updated_at: now() }));
  },

  loadPlan: () => read<WeekPlan>(KEYS.plan),
  savePlan(p: WeekPlan) {
    write(KEYS.plan, p);
    cloud((uid) => db().from('week_plans').upsert({ user_id: uid, plan: p, updated_at: now() }));
  },

  /** Ticked shopping items, keyed by the plan they belong to */
  loadTicked(planKey: string) {
    const saved = read<Ticked>(KEYS.grocery);
    return new Set(saved?.plan === planKey ? saved.keys : []);
  },
  saveTicked(planKey: string, keys: Set<string>) {
    const value: Ticked = { plan: planKey, keys: [...keys] };
    write(KEYS.grocery, value);
    cloud((uid) => db().from('week_plans').update({ grocery: value, updated_at: now() }).eq('user_id', uid));
  },

  /**
   * After sign-in: fetch the family's saved data and keep a copy on this phone.
   * Returns null when this Google account has nothing saved yet.
   */
  async pullFromCloud(): Promise<{ profile: FamilyProfile; plan: WeekPlan | null } | null> {
    const sb = supabase();
    if (!sb || !userId) return null;
    const [fam, week] = await Promise.all([
      sb.from('families').select('profile').eq('user_id', userId).maybeSingle(),
      sb.from('week_plans').select('plan, grocery').eq('user_id', userId).maybeSingle(),
    ]);
    if (fam.error || week.error) throw new Error(fam.error?.message ?? week.error?.message);
    if (!fam.data) return null;
    const profile = withDefaults(fam.data.profile as FamilyProfile);
    const plan = (week.data?.plan as WeekPlan | undefined) ?? null;
    write(KEYS.profile, profile);
    if (plan) write(KEYS.plan, plan);
    const grocery = week.data?.grocery as Ticked | undefined;
    if (grocery?.plan) write(KEYS.grocery, grocery);
    return { profile, plan };
  },

  /** First sign-in on a phone that already has a family: copy it to the account. */
  pushAllToCloud() {
    const profile = storage.loadProfile();
    const plan = storage.loadPlan();
    const grocery = read<Ticked>(KEYS.grocery) ?? {};
    if (profile) storage.saveProfile(profile);
    if (plan) cloud((uid) => db().from('week_plans').upsert({ user_id: uid, plan, grocery, updated_at: now() }));
  },

  /** Removes the family's data from this phone (used on sign-out). */
  clearLocal: () => [KEYS.profile, KEYS.plan, KEYS.grocery].forEach(remove),

  /** "Start over": removes this phone's copy and, if signed in, the online copy. */
  clearAll() {
    storage.clearLocal();
    cloud((uid) => db().from('week_plans').delete().eq('user_id', uid));
    cloud((uid) => db().from('families').delete().eq('user_id', uid));
  },
};
