// Daily job: every evening, send each opted-in cook tomorrow's menu in Hindi on WhatsApp.
//
// Vercel runs this once a day (see vercel.json, about 8 pm India time) by calling GET /api/cook-daily.
// This TypeScript file is bundled into api/cook-daily.js by `npm run api` (commit both).
//
// It does nothing until these are set in Vercel → Project → Settings → Environment Variables
// (never put them in the code; see docs/whatsapp-setup.md):
//   CRON_SECRET                 any long random text; Vercel sends it with each scheduled call
//   SUPABASE_SERVICE_ROLE_KEY   Supabase → Project Settings → API keys → secret key (server only)
//   WHATSAPP_TOKEN              Meta WhatsApp Cloud API permanent access token
//   WHATSAPP_PHONE_NUMBER_ID    the ID of Rasoi Planner's WhatsApp number in Meta
// Optional: SUPABASE_URL, WHATSAPP_TEMPLATE (default rasoi_kal_ka_khana), WHATSAPP_TEMPLATE_LANG (default hi).
// Add ?dry=1 to the call to see what would be sent, without sending anything.

import { cookTemplateParams, isPlanUsable, type FamilyProfile, type WeekPlan } from '../src/engine';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://arwkorwglqcuosngfubv.supabase.co';
const GRAPH = 'https://graph.facebook.com/v21.0';

interface FamilyRow {
  user_id: string;
  profile: FamilyProfile;
}
interface PlanRow {
  user_id: string;
  plan: WeekPlan;
}

/** Tomorrow's date in India (YYYY-MM-DD), whatever time zone the server runs in. */
export function tomorrowInIndia(now = new Date()): string {
  const india = new Date(now.getTime() + 5.5 * 3600e3 + 864e5);
  return india.toISOString().slice(0, 10);
}

/** Only cooks with a valid Indian mobile number, a family that turned it on, and the cook's agreement. */
export function readyToSend(p: FamilyProfile): boolean {
  return !!p.dailyCook && !!p.cookConsent && /^91[6-9]\d{9}$/.test(p.cookPhone ?? '');
}

async function supabase<T>(path: string, key: string): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return (await r.json()) as T;
}

async function sendTemplate(to: string, params: string[]): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: process.env.WHATSAPP_TEMPLATE ?? 'rasoi_kal_ka_khana',
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? 'hi' },
        components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
      },
    }),
  });
  if (r.ok) return { ok: true };
  const body = (await r.json().catch(() => ({}))) as { error?: { message?: string } };
  return { ok: false, error: body.error?.message ?? `HTTP ${r.status}` };
}

const json = (status: number, body: unknown) => Response.json(body, { status });

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return json(401, { error: 'Not allowed' });
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return json(200, { skipped: 'SUPABASE_SERVICE_ROLE_KEY is not set yet' });
  const canSend = !!process.env.WHATSAPP_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID;
  const dry = new URL(request.url).searchParams.get('dry') === '1' || !canSend;

  const date = tomorrowInIndia();
  const families = (await supabase<FamilyRow[]>('families?select=user_id,profile&profile->>dailyCook=eq.true', key)).filter((f) => readyToSend(f.profile));
  const result = { date, dry, families: families.length, sent: 0, noMenu: 0, failed: [] as string[], preview: [] as string[][] };
  if (!families.length) return json(200, result);

  const ids = families.map((f) => f.user_id).join(',');
  const plans = await supabase<PlanRow[]>(`week_plans?select=user_id,plan&user_id=in.(${ids})`, key);
  const planOf = new Map(plans.map((p) => [p.user_id, p.plan]));

  for (const f of families) {
    const plan = planOf.get(f.user_id);
    // A menu that has run out (or names a removed dish) is skipped; the family makes a new one in the app.
    const day = isPlanUsable(plan) ? plan.days.find((d) => d.date === date) : undefined;
    if (!day) {
      result.noMenu++;
      continue;
    }
    const params = cookTemplateParams(day, f.profile);
    if (dry) {
      if (result.preview.length < 3) result.preview.push(params);
      continue;
    }
    const sent = await sendTemplate(f.profile.cookPhone!, params);
    if (sent.ok) result.sent++;
    else result.failed.push(`${f.user_id.slice(0, 8)}…: ${sent.error}`);
  }
  return json(200, result);
}
