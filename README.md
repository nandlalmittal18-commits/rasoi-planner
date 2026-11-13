# Rasoi Planner

**Live app:** https://rasoi-planner-eta.vercel.app

A balanced weekly menu for Indian homes: breakfast, lunch and dinner planned around the family's diet, fasting days, favourite cuisines, tiffin and cooking time, plus as many world-food dinners (Chinese, Italian, Continental, Mexican, Thai, Middle Eastern) as the family wants. It also gives night-before prep reminders, a shopping list, and WhatsApp messages for the family and, in Hindi, for the cook.

## What's in version 1

| Screen | What it does |
| --- | --- |
| **Menu** | 7-day menu, one day at a time. Swap any dish with one tap, shuffle a day or the whole week. "Plan ahead" shows what to soak, ferment or marinate the night before. Share the day on WhatsApp in English (family) or Hindi (cook). |
| **Shopping** | Main ingredients for the week, grouped like a shop list. Tick what you have; send the rest on WhatsApp. |
| **Dishes** | All 200 dishes (153 Indian, 47 world) with search and filters (cuisine, meal, veg, Jain, vrat, tiffin, kids). Mark "Never suggest". |
| **Family** | Diet and non-veg days, Jain, no onion-garlic, weekly vrat, Indian cuisines, world-food dinners per week and which world cuisines, weekday cooking time, kids, tiffin, cook's name. |

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev        # opens the app at http://localhost:5173
npm test           # runs the menu-engine checks (15 tests)
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
    menu.test.ts     Checks that every rule is respected
  data/dishes.json   The dish database (generated, do not edit by hand)
  components/        The four screens
  lib/storage.ts     Where data is saved (this phone's browser for now)
scripts/
  dishes.psv         The dish sheet as text (one dish per line, columns split by |)
  build_dishes.py    Turns dishes.psv into src/data/dishes.json
```

### Adding or changing dishes

1. Edit the dish in your Dish Database sheet, then copy the rows into `scripts/dishes.psv` (same columns, with the Hindi name last). Or edit `dishes.psv` directly.
2. Run `python3 scripts/build_dishes.py`, then `npm test`.
3. If the new dish has a new "Prep Ahead" text, add its Hindi to `PREP_HI` in `src/engine/prep.ts`.

## How the menu engine decides

1. **Never broken:** diet, non-veg days, Jain, no onion-garlic, vrat days, "never suggest" dishes.
2. **Kept whenever possible**, relaxed one at a time only if nothing fits, in this order: in-season dishes only, then the weekday cooking-time limit, then no dish twice in a week, and last a tiffin-friendly weekday lunch and at most one heavy dish a day (no heavy breakfast on weekdays).
3. **Preferred:** chosen cuisines, kid favourites, seasonal dishes; bigger dishes at the weekend.
4. **World food** appears only on the chosen number of world-food dinners a week (never on a vrat day; weekends slightly more likely), with a soup or side from the same cuisine. Liked world cuisines are picked about 30 times more often than others. "None" keeps every meal Indian.
5. Meals follow familiar patterns: dal + sabzi + roti/rice, rice meal, paneer meal, non-veg meal, one-pot dinner, dosa-style dinner, weekend special. Roti or rice is chosen from what the main dish is usually eaten with.

## Roadmap

**Phase 2 – accounts and database (Supabase).** Families log in with their phone number (OTP) and their menu works on any device. Replace `src/lib/storage.ts` with Supabase calls. Tables to start with: `families` (the profile), `week_plans` (the plan as JSON), `dishes` (move the database here so you can edit it without a new release).

**Phase 3 – WhatsApp bot.** A Vercel serverless function (`/api/whatsapp`) receives messages from a WhatsApp Business provider (Gupshup, AiSensy, Interakt, WATI or Meta's Cloud API). Every evening it sends each family tomorrow's menu using `dayMessage` / `cookMessage`, and replies like "1" (swap) call `swapItem`. Needs Meta business verification; business-initiated messages are charged per message.

**Phase 4 – business.** Payments (Razorpay) for a premium plan, grocery-app links, more dishes and regional depth, nutrition goals.

## Privacy

Version 1 stores everything only in the browser of the phone where it was set up. Nothing is sent to a server. Once you add accounts (Phase 2) you will be holding family and health-related preferences, so follow India's Digital Personal Data Protection Act: ask for consent, collect only what you need, and let users delete their data.
