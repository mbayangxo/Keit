# Get K21 online (plain English)

You may already have **Supabase**. Here is how the pieces fit together.

## What Supabase is (in this project)

| Supabase gives you | K21 uses it for |
|--------------------|-----------------|
| **Postgres database** | Users, wallets, transactions — via `DATABASE_URL` |
| **Optional cron** (`supabase/migrations`) | Can ping Vercel cron URLs on a schedule |
| **Not** the mobile app UI | That is Expo in `src/` |
| **Not** the payment API | That is Vercel `/api/*` |

So: **Supabase = where data is stored.**  
**Vercel = where the app + API run** (what users hit in the browser or what the phone app calls).

If your Supabase project has a connection string in Vercel as `DATABASE_URL`, **your database is already “hosted.”** You do not need a second database.

## What “host the backend” meant

It does **not** mean “replace Supabase.” It means:

1. **Deploy this repo to Vercel** (one project: website + `/api` routes).
2. **Set env vars on Vercel**, including:
   - `DATABASE_URL` → your Supabase Postgres URL (Settings → Database → connection string)
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` → long random strings
3. **Apply the schema once:** `npm run db:push` (or run migrations) against that database.

After that, `https://your-app.vercel.app/api/health` should return `"status":"ok"`.

## Checklist (you or someone technical)

- [ ] Vercel project connected to GitHub repo `keit`
- [ ] `DATABASE_URL` on Vercel points to Supabase Postgres
- [ ] JWT secrets set on Vercel
- [ ] `npm run db:push` run once against that database
- [ ] Open `/api/health` in browser — should not be 503
- [ ] For the phone app: `EXPO_PUBLIC_API_URL=https://your-app.vercel.app` in Expo env
- [ ] (Later) SMS keys for real OTP; Julaya keys for real mobile money

## Local test (same machine)

```bash
# Copy env and fill DATABASE_URL from Supabase
cp .env.example .env.local

# Apply schema
npm run db:push

# API + web on one port
npx vercel dev

# In another terminal — phone app points at local API
EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo start
```

## Still your job (not code)

- SMS provider (Africa’s Talking / Twilio) for production OTP
- Julaya / Pawapay keys for live mobile money
- App Store / Play Store accounts
- BCEAO / legal path

Everything else in the “host backend” list is **this Vercel + Supabase DATABASE_URL setup**, not a separate product.
