# Rasoi Planner

**Live app:** https://rasoi-planner-eta.vercel.app

A balanced weekly menu for Indian homes: breakfast, lunch and dinner planned around the family's diet, fasting days, favourite cuisines, tiffin and cooking time, plus as many world-food dinners (Chinese, Italian, Continental, Mexican, Thai, Middle Eastern) as the family wants. It also gives night-before prep reminders, a shopping list, and WhatsApp messages for the family and, in Hindi, for the cook.

## What's in version 1

| Screen | What it does |
| --- | --- |
| **Menu** | 7-day menu, one day at a time. Swap any dish with one tap, shuffle a day or the whole week. "Plan ahead" shows what to soak, ferment or marinate the night before. Share the day on WhatsApp in English (family) or Hindi (cook). |
| **Shopping** | Main ingredients for the week, grouped like a shop list. Tick what you have; send the rest on WhatsApp. |
| **Dishes** | All 204 dishes (157 Indian, 47 world) with a picture, search and filters (cuisine, meal, veg, Jain, vrat, tiffin, kids). Mark "Never suggest". |
| **Dish details** | Tap any dish: picture, cooking time, difficulty, heaviness, season, tags (Jain, vrat, tiffin, kids), prep-ahead, main ingredients, what it goes with, and a short recipe in English or Hindi. "Send recipe to cook" shares the Hindi recipe on WhatsApp. |
| **Account** | "Continue with Google" saves the family and menu online (Supabase), so the same menu shows on every phone. Without signing in, everything stays on the phone. |
| **Family** | Diet and non-veg days, Jain, no onion-garlic, weekly vrat, Indian cuisines, world-food dinners per week and which world cuisines, weekday cooking time, kids, tiffin, cook's name. |

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev        # opens the app at http://localhost:5173
npm test           # runs the menu-engine checks (17 tests)
npm run build      # makes the production files in dist/
```

## Put it online with Vercel (free)

1. Create a new repository on GitHub and push this folder to it:
   ```bash
   git init && git add . && git commit -m "Rasoi Planner v1"
   git branch -M main
   git remote add origin https://github.com/<your-username>/rasoi-planner.git
   git push -u origin main
   ```
2. On [vercel.com](https://vercel.com), choose **Add New → Project**, pick the repository and press **Deploy**. Vercel detects Vite by itself (build: `npm run build`, output: `dist`).
3. You get a link like `rasoi-planner.vercel.app`. Every push to `main` updates it. Add your own domain later under **Settings → Domains**.

## How the project is organised

```
src/
  engine/            The brain. Plain TypeScript, no React, so the WhatsApp bot can reuse it.
    menu.ts          Builds the week, swaps dishes, shuffles a day
    prep.ts          Night-before / morning reminders (+ Hindi)
    grocery.ts       Shopping list
    share.ts         WhatsApp messages (English + Hindi)
    recipes.ts       Recipe lookup and WhatsApp recipe message
    menu.test.ts     Checks that every rule is respected
  data/dishes.json   The dish database (generated, do not edit by hand)
  data/recipes.json  Recipes in English and Hindi (generated from scripts/recipes/*.json)
  components/        The screens, the dish detail sheet and the dish pictures (DishArt.tsx)
  lib/storage.ts     Where data is saved: this phone, plus Supabase when signed in
  lib/supabase.ts    Supabase connection and Google sign-in
supabase/schema.sql  Database tables and security rules (run once in Supabase)
docs/google-login-setup.md  One-time Google + Supabase setup steps
scripts/
  dishes.psv         The dish sheet as text (one dish per line, columns split by |)
  build_dishes.py    Turns dishes.psv into src/data/dishes.json
```

### Adding or changing dishes

1. Edit the dish in your Dish Database sheet, then copy the rows into `scripts/dishes.psv` (same columns, with the Hindi name last). Or edit `dishes.psv` directly.
2. Run `python3 scripts/build_dishes.py`, then `npm test`.
3. If the new dish has a new "Prep Ahead" text, add its Hindi to `PREP_HI` in `src/engine/prep.ts`.
4. Add its recipe (English and Hindi, same number of steps) to a file in `scripts/recipes/`, then run `python3 scripts/build_recipes.py`. It refuses to build if any dish is missing a recipe.
5. Its picture is drawn automatically from its name and category (`src/components/DishArt.tsx`).

### Dish photos

Photos come from Wikipedia / Wikimedia Commons (free to use with credit). The app fetches them itself the first time it opens and keeps them on the phone for two weeks.

- `src/data/photo-sources.json`: for each dish, the Wikipedia article(s) to take the photo from. The first with a free photo wins. Vegetarian dishes only use articles about that exact dish, so no meat photo appears (a test checks this).
- `src/data/photos.json`: your own overrides. Add your own or bought photos, or hide a wrong one:

```json
"poha": { "src": "https://…/poha.jpg", "credit": "Your name", "license": "Own photo" },
"tinda-masala": { "hide": true }
```

The photographer and licence show on each dish's detail screen. A dish without a photo shows its drawn picture.

## How the menu engine decides

1. **Never broken:** diet, non-veg days, Jain, no onion-garlic, vrat days, "never suggest" dishes.
2. **Kept whenever possible**, relaxed one at a time only if nothing fits, in this order: in-season dishes only, then the weekday cooking-time limit, then no dish twice in a week, and last a tiffin-friendly weekday lunch and at most one heavy dish a day (no heavy breakfast on weekdays).
3. **Preferred:** chosen cuisines, kid favourites, seasonal dishes; bigger dishes at the weekend.
4. **World food** appears only on the chosen number of world-food dinners a week (never on a vrat day; weekends slightly more likely), with a soup or side from the same cuisine. Liked world cuisines are picked about 30 times more often than others. "None" keeps every meal Indian.
5. Meals follow familiar patterns: dal + sabzi + roti/rice, rice meal, paneer meal, non-veg meal, one-pot dinner, dosa-style dinner, weekend special. Roti or rice is chosen from what the main dish is usually eaten with.

## Roadmap

**Phase 2 – accounts and database (Supabase). ✅ Built.** Google sign-in; `families` and `week_plans` tables with row level security; data moves from the phone to the account on first sign-in. Setup steps: `docs/google-login-setup.md`. Next in this phase: move the dish list into a `dishes` table so it can be edited without a new release, and add email or phone login.

**Phase 3 – WhatsApp bot.** A Vercel serverless function (`/api/whatsapp`) receives messages from a WhatsApp Business provider (Gupshup, AiSensy, Interakt, WATI or Meta's Cloud API). Every evening it sends each family tomorrow's menu using `dayMessage` / `cookMessage`, and replies like "1" (swap) call `swapItem`. Needs Meta business verification; business-initiated messages are charged per message.

**Phase 4 – business.** Payments (Razorpay) for a premium plan, grocery-app links, more dishes and regional depth, nutrition goals.

## Privacy

Without signing in, everything stays in the browser of the phone where it was set up. When a family signs in with Google, their profile and menu are stored in your Supabase project, and row level security means each account can only read its own rows. "Start over" deletes the online copy too. You are now holding family and health-related preferences, so follow India's Digital Personal Data Protection Act: publish a short privacy notice, collect only what you need, and honour deletion requests.
