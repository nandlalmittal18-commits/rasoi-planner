# Turning on "Continue with Google" (one-time setup, ~15 minutes)

The app code is ready. These steps connect Google and Supabase. You do them once.

You will need two browser tabs:
- **Supabase:** https://supabase.com/dashboard → your `rasoi-planner` project
- **Google Cloud:** https://console.cloud.google.com

Google and Supabase change their screens from time to time. If a button name differs slightly, look for the closest match.

---

## Step 1 — Create the database tables (Supabase, 2 min)

1. In Supabase, open **SQL Editor** (left menu) → **New query**.
2. Open `supabase/schema.sql` from the GitHub repository, copy **all** of it, and paste it into the editor.
3. Press **Run**. You should see "Success. No rows returned".
4. Open **Table Editor**: you should now see `families` and `week_plans`.

## Step 2 — Create a Google sign-in key (Google Cloud, 8 min)

1. In Google Cloud, click the project picker at the top → **New project** → name it `Rasoi Planner` → **Create**. Make sure it is selected.
2. Open the menu → **APIs & Services** → **OAuth consent screen** (it may be called **Google Auth Platform**) → **Get started**.
   - **App name:** Rasoi Planner
   - **User support email:** your email
   - **Audience:** External
   - **Contact email:** your email
   - Agree to the policy → **Create**.
3. Go to **Clients** (or **Credentials → Create credentials → OAuth client ID**):
   - **Application type:** Web application
   - **Name:** Rasoi Planner web
   - **Authorized JavaScript origins → Add URI:** `https://rasoi-planner-eta.vercel.app`
   - **Authorized redirect URIs → Add URI:** `https://arwkorwglqcuosngfubv.supabase.co/auth/v1/callback`
   - Press **Create**. A box shows a **Client ID** and a **Client secret**. Keep this tab open.
   - ⚠️ The **Client secret** is private. Paste it only into Supabase (Step 3). Never send it to anyone, including Claude.
4. Go to **Audience** → **Publish app** → confirm. While the app is in "Testing", only test users you add by hand can sign in. Basic sign-in (name and email) normally needs no Google review.

## Step 3 — Give the key to Supabase (2 min)

1. In Supabase: **Authentication** → **Sign In / Providers** (or **Providers**) → **Google**.
2. Turn on **Enable Sign in with Google**.
3. Paste the **Client ID** and **Client secret** from Step 2.
4. Check that the **Callback URL** shown there is `https://arwkorwglqcuosngfubv.supabase.co/auth/v1/callback` (the same as in Step 2).
5. **Save**.

## Step 4 — Tell Supabase where the app lives (1 min)

1. In Supabase: **Authentication** → **URL Configuration**.
2. **Site URL:** `https://rasoi-planner-eta.vercel.app` → **Save**.
3. **Redirect URLs → Add URL**, add both:
   - `https://rasoi-planner-eta.vercel.app/**`
   - `http://localhost:5173/**` (for testing on your computer)
4. **Save**.

## Step 5 — Try it

1. Open https://rasoi-planner-eta.vercel.app on your phone → **Family** → **Continue with Google**.
2. Choose your Google account. You come back to the app and see **"Menu saved to your account"**.
3. In Supabase → **Table Editor** → `families`: your family is there. The `family_overview` view lists every family that has signed up, with email, diet and cuisines.
4. Open the app on a second phone or computer and sign in with the same Google account: the same menu appears.

### If something goes wrong
| You see | Fix |
| --- | --- |
| "Unsupported provider: provider is not enabled" | Step 3 was not saved. |
| Google says "redirect_uri_mismatch" | The redirect URI in Step 2.3 must be exactly the Supabase callback URL. |
| You land on the wrong website after signing in | Check Site URL and Redirect URLs in Step 4. |
| "Access blocked: app is in testing" | Publish the app (Step 2.4) or add the person as a test user. |
| "Couldn't load your saved menu" | Step 1 was not run, or the internet dropped. |
