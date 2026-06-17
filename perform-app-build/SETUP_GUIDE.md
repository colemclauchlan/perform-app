# PERFORM — Setup Guide

This is your personal performance-tracking web app. It tracks nutrition, compound protocols, workouts, body weight, and steps. Everything you log is saved to your own private database, so it's there on every device you log in from.

This guide assumes **zero coding experience**. Just follow the steps in order. Total time: about 30–40 minutes, all free.

You'll create 2 free accounts:
1. **Supabase** — your database + login system (free)
2. **Vercel** — hosts the website so you can open it from any browser (free)

You do NOT need to install anything on your computer. Everything below happens in your web browser.

---

## STEP 1 — Put the code on GitHub (10 min)

Vercel needs to read your code from GitHub. Don't worry, you don't have to understand Git.

1. Go to **https://github.com** and create a free account (if you don't have one).
2. Click the **+** in the top-right → **New repository**.
3. Name it `perform-app`. Leave everything else default. Click **Create repository**.
4. On the next page, click the link that says **"uploading an existing file"** (it's in the line: _"…or push an existing repository…"_ — look for the **upload** option, OR go to `https://github.com/YOUR-USERNAME/perform-app/upload/main`).
5. **Unzip the `perform-app.zip` I gave you** on your computer first. Then drag ALL the files and folders from inside the unzipped folder into the GitHub upload box.
   - ⚠️ Important: drag the *contents* (the `app` folder, `package.json`, etc.), not the outer `perform-app` folder itself.
6. Scroll down, click **Commit changes**.

Your code is now on GitHub. ✅

---

## STEP 2 — Create your database on Supabase (10 min)

1. Go to **https://supabase.com** → **Start your project** → sign in with GitHub (easiest).
2. Click **New project**.
   - **Name:** `perform`
   - **Database Password:** click *Generate a password* and **save it somewhere** (you likely won't need it again, but keep it safe).
   - **Region:** pick the one closest to you.
   - Click **Create new project**. Wait ~2 minutes for it to set up.
3. Once ready, in the left sidebar click the **SQL Editor** icon (looks like a terminal/`>_`).
4. Click **+ New query**.
5. Open the file `supabase/migrations/001_initial_schema.sql` from your code (open it in any text editor like Notepad), **select all the text, copy it**, and **paste it** into the Supabase SQL editor box.
6. Click **Run** (bottom right, or press Ctrl/Cmd + Enter).
   - You should see "Success. No rows returned." That means all your tables + the starter food/compound/exercise lists were created. ✅

### Get your 2 secret keys
7. In the left sidebar, click the **gear icon (Project Settings)** at the bottom → **API**.
8. You'll see:
   - **Project URL** — copy it (looks like `https://abcdxyz.supabase.co`)
   - **Project API keys → `anon` `public`** — copy that long key.
9. Keep these two values handy for Step 3.

### Turn off email confirmation (optional but easier for personal use)
10. Left sidebar → **Authentication** → **Sign In / Providers** → **Email**.
11. Find **"Confirm email"** and toggle it **OFF**, then Save. (This lets you log in immediately without clicking a confirmation email. Skip this if you'd rather keep email confirmation on.)

---

## STEP 3 — Deploy the website with Vercel (10 min)

1. Go to **https://vercel.com** → **Sign Up** → continue with GitHub.
2. On your dashboard click **Add New… → Project**.
3. Find `perform-app` in the list → click **Import**.
4. Before deploying, expand the **Environment Variables** section and add these two (this is how the site talks to your database):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | *(paste your Project URL from Step 2.8)* |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(paste your anon public key from Step 2.8)* |

   Type the name on the left, paste the value on the right, click **Add** for each.
5. Click **Deploy**. Wait ~2 minutes.
6. When it's done you'll see confetti and a **"Visit"** button. Click it.

🎉 **Your app is live!** The URL will look like `https://perform-app-xxxx.vercel.app`. Bookmark it.

---

## STEP 4 — Create your account & start using it

1. Open your live URL.
2. Click **Sign up**, enter an email + password (min 6 characters).
   - If you turned email confirmation OFF in Step 2.11, you can log in right away.
   - If you left it ON, check your email, click the confirm link, then log in.
3. You're in! Set your macro targets in **Settings** first, then start logging.

### Add it to your iPhone home screen (acts like an app)
1. Open your Vercel URL in **Safari** on your iPhone.
2. Tap the **Share** button → **Add to Home Screen**.
3. It now opens fullscreen with the PERFORM icon, just like a native app. (This is the bridge until the real iOS App Store version.)

---

## What's already in there

- **25 common foods**, **20 compounds** (with half-lives), and **26 exercises** are pre-loaded so you can start immediately. Add your own anytime in the Catalog pages.
- Your data is private to your login — Row Level Security is enabled on every table, so no one else can see it.

---

## Making changes later

Any time you want to tweak something: edit the file on GitHub (or re-upload), and Vercel automatically rebuilds and redeploys within ~2 minutes. No manual steps.

---

## The iOS App Store version (the next phase)

What you have now works great on the iPhone via "Add to Home Screen," but it can't read the Apple Health pedometer — only a true native app can. When you're ready, the plan is:

1. Build a companion app with **Expo / React Native** that reuses this exact Supabase database (so all your existing data shows up automatically).
2. Use Apple's **HealthKit** to read your daily steps and write them into the `step_logs` table you already have.
3. Enroll in the **Apple Developer Program** ($99/year) and submit to the App Store (review takes 1–3 days).

The database is already designed for this — the `step_logs` table has a `source` field that marks whether steps came from `apple_health` or `manual`. Nothing needs to change on the backend.

Just say the word when you want to start that phase.

---

## Troubleshooting

- **"Invalid API key" or login fails** → double-check the two environment variables in Vercel (Project → Settings → Environment Variables). After fixing, go to the **Deployments** tab → click the "…" on the latest → **Redeploy**.
- **SQL error in Step 2** → make sure you copied the *entire* SQL file from top to bottom.
- **Page won't load / 404** → confirm you uploaded the *contents* of the folder to GitHub, not the wrapping folder. The `app/` folder and `package.json` should be at the top level of your repo.

You've got this. Take it one step at a time.
