# Rasoi Planner – notes for Claude Code

A startup product that plans weekly menus for Indian households. Users: urban working couples (often with a cook), homemakers, families. The owner is a near-beginner programmer: explain changes in plain language, work in small steps, and run the tests after every change.

## Stack
- Vite + React 19 + TypeScript, plain CSS (`src/index.css`, tokens at the top).
- Tests: Vitest (`npm test`). Build: `npm run build`. Dev server: `npm run dev`.
- Hosting: Vercel. Planned: Supabase (auth + Postgres), WhatsApp Business API via a provider.

## Rules for working in this repo
- `src/engine/` must stay free of React and browser APIs. The WhatsApp bot will import it on the server.
- Every menu rule lives in `src/engine/menu.ts`. If you add or change a rule, add a test to `src/engine/menu.test.ts`.
- `src/data/dishes.json` is generated. Change `scripts/dishes.psv`, then run `python3 scripts/build_dishes.py`.
- `src/data/recipes.json` is generated from `scripts/recipes/*.json` by `python3 scripts/build_recipes.py`. Every dish needs a recipe with the same number of English and Hindi steps.
- `src/data/nutrition.json` is generated from `scripts/nutrition/ingredients.psv` + `servings.psv` by `python3 scripts/build_nutrition.py`. Every dish needs a serving line. Values are approximate; always show them with the "not medical advice" note.
- Design: saffron & white, light only (no dark mode). Colour tokens are at the top of `src/index.css`.
- All saving goes through `src/lib/storage.ts` (phone copy + Supabase when signed in). Don't call localStorage or Supabase tables anywhere else.
- Supabase: project `arwkorwglqcuosngfubv`. The URL and publishable key in `src/lib/supabase.ts` are public by design. Database changes go in `supabase/schema.sql` (keep it re-runnable) and every table needs row level security.
- Hard rules (diet, non-veg days, Jain, no onion-garlic, vrat days, dislikes) must never be relaxed.
- User-facing text: short, plain English. Hindi strings are for the cook's WhatsApp message.
- Never commit secrets. Put keys in `.env.local` (already git-ignored) and in Vercel's environment variables.
