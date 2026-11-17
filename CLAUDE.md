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
- `src/data/nutrition.json` and `src/data/amounts.json` (shopping amounts) are generated from `scripts/nutrition/ingredients.psv` + `servings.psv` by `python3 scripts/build_nutrition.py`. New ingredient names need a line in its `KEY_FOR` table. Every dish needs a serving line. Values are approximate; always show them with the "not medical advice" note.
- Design: indigo blue (#1f3a9e) & white with a haldi-yellow accent, light only (no dark mode). Photo-first dish cards, Outfit font (Hind for Hindi). Colour tokens are at the top of `src/index.css`.
- Dish photos: our own pictures only, in `public/photos/<dish id>.jpg`, listed in `src/data/photos.json`. No photo credits are shown. Prompts for new pictures: `python3 scripts/photo_prompts.py`.
- All saving goes through `src/lib/storage.ts` (phone copy + Supabase when signed in). Don't call localStorage or Supabase tables anywhere else.
- Supabase: project `arwkorwglqcuosngfubv`. The URL and publishable key in `src/lib/supabase.ts` are public by design. Database changes go in `supabase/schema.sql` (keep it re-runnable) and every table needs row level security.
- Hard rules (vegetarian only, Jain, no onion-garlic, vrat days, festival days the family keeps, dislikes) must never be relaxed. Thumbs up/down ratings are soft.
- Festival dates live in `src/engine/festivals.ts` (Nov 2026 to Dec 2027). Add the next year's dates before December 2027.
- User-facing text: short, plain English. Hindi strings are for the cook's WhatsApp message.
- Daily cook WhatsApp: `server/cook-daily.ts` (uses `src/engine/cook.ts`) is bundled into `api/cook-daily.js` by `npm run api`; run it after changing either and commit both. Schedule in `vercel.json`. Setup and secret keys: `docs/whatsapp-setup.md`.
- Never commit secrets. Put keys in `.env.local` (already git-ignored) and in Vercel's environment variables.
