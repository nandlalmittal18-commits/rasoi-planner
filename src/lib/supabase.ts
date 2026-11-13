import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// These two values are public by design: every app that uses Supabase ships them
// to the browser. Row level security (supabase/schema.sql) is what protects the data.
// Never put the *secret* key (sb_secret_…) or service_role key in this app.
const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://arwkorwglqcuosngfubv.supabase.co';
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_1LSRN0hKWSTy6CEpx_HHWA_kOUHEW80';

let client: SupabaseClient | null = null;

/** The Supabase client, or null when the app runs without a backend (tests, offline demos). */
export function supabase(): SupabaseClient | null {
  if (client) return client;
  if (!url || !publishableKey || typeof window === 'undefined') return null;
  try {
    client = createClient(url, publishableKey, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  } catch {
    client = null;
  }
  return client;
}

export async function signInWithGoogle(): Promise<string | null> {
  const sb = supabase();
  if (!sb) return 'Online sign-in is not available here.';
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
  });
  return error ? error.message : null;
}

export async function signOut(): Promise<void> {
  await supabase()?.auth.signOut();
}
