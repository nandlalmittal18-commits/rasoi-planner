// Version 1 keeps each family's data in the browser of the phone it was set up on.
// Phase 2 swaps this file for Supabase (login + database) so families can use
// any device and the WhatsApp bot can read the same menus. Keep every read and
// write going through these functions so that swap touches only this file.

import type { FamilyProfile, WeekPlan } from '../engine';

const KEYS = {
  profile: 'rasoi.profile.v1',
  plan: 'rasoi.plan.v1',
  grocery: 'rasoi.grocery.v1',
};

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

export const storage = {
  loadProfile: () => {
    const saved = read<FamilyProfile>(KEYS.profile);
    // Profiles saved before world cuisines existed get the default of 1 world dinner a week.
    return saved ? { ...saved, worldMealsPerWeek: saved.worldMealsPerWeek ?? 1 } : null;
  },
  saveProfile: (p: FamilyProfile) => write(KEYS.profile, p),
  loadPlan: () => read<WeekPlan>(KEYS.plan),
  savePlan: (p: WeekPlan) => write(KEYS.plan, p),
  /** Ticked shopping items, keyed by the plan they belong to */
  loadTicked: (planKey: string) => {
    const saved = read<{ plan: string; keys: string[] }>(KEYS.grocery);
    return new Set(saved?.plan === planKey ? saved.keys : []);
  },
  saveTicked: (planKey: string, keys: Set<string>) => write(KEYS.grocery, { plan: planKey, keys: [...keys] }),
  clearAll: () => Object.values(KEYS).forEach(remove),
};
