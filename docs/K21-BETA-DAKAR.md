# K21 beta — 50 friends in Dakar (start here)

Your site: **https://keit-six.vercel.app**

Right now the **home page works** but **signup does not** — because the server code (`api/`, `lib/`, `prisma/`) lives on your Mac and was **never pushed to GitHub**. Vercel only deploys what’s on GitHub.

---

## Step 1 — Push the backend (required once)

Someone with git access must commit and push the project (including `api/`, `lib/`, `prisma/`). After push, Vercel redeploys automatically.

**Test after redeploy:** open  
https://keit-six.vercel.app/api/health  

You want JSON like `"status":"ok"`. If you still see **404**, the push didn’t include `api/` or the deploy failed.

---

## Step 2 — Vercel environment variables

Vercel → your **keit** project → **Settings** → **Environment Variables**

Add these for **Production** (and Preview if you use preview URLs):

| Name | Value | Where to get it |
|------|--------|-----------------|
| `DATABASE_URL` | `postgresql://...` | Supabase → **Database** → Connection string → **URI** → pick **Transaction pooler** (port **6543**). Must include `?pgbouncer=true&sslmode=require` (K21 adds `connection_limit=1` on Vercel automatically). |
| `JWT_ACCESS_SECRET` | long random string | Run in Terminal: `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | different random string | Run again: `openssl rand -base64 32` |
| `EXPO_PUBLIC_API_URL` | `https://keit-six.vercel.app` | So the web app knows where the API is |
| `ALLOW_BETA_OTP` | `true` | Return OTP in API when SMS is not configured (Dakar beta) |
| `EXPO_PUBLIC_ALLOW_BETA_OTP` | `true` | Show OTP on signup screen in the web build |
| `DATA_ENCRYPTION_KEY` | `openssl rand -base64 32` | Required in production |
| `CRON_SECRET` | `openssl rand -base64 32` | Required in production |

Optional for beta (OTP shows in API response without SMS):

- Leave SMS vars empty — in non-production, dev OTP is returned in the API for testing.

Optional later:

- `AFRICASTALKING_API_KEY` + `AFRICASTALKING_USERNAME` for real SMS in production
- `JULAYA_API_KEY_SANDBOX` for real mobile-money deposits

After adding variables → **Redeploy** (Deployments → … → Redeploy).

---

## Step 3 — Create database tables (once)

**If you see `Environment variable not found: DATABASE_URL`** — Prisma needs the URL on your Mac first (same value as Vercel).

```bash
cd /path/to/keit
cp .env.example .env
# Edit .env — paste your Supabase DATABASE_URL and JWT secrets (for local API only)
npm install
npm run db:push
```

This creates users, wallets, OTP tables, etc. in Supabase.

**Test again:** https://keit-six.vercel.app/api/health?deep=1  
Should show `"db":"ok"`.

---

## Step 4 — Try signup on your phone (easiest: browser)

No Expo required for this path.

1. On your phone, open **Safari** or **Chrome**.
2. Go to **https://keit-six.vercel.app**
3. Create account → enter phone → use the OTP (if SMS not set up, check Vercel **Functions** logs for the code during dev, or use a test phone flow your dev sets up).

Share that same URL with your 50 friends in Dakar for beta v1.

---

## Step 5 — Native app feel (optional): Expo Go

Use this if you want the app icon experience before App Store.

### On your phone

1. Install **Expo Go** from the App Store (iPhone) or Play Store (Android).
2. Same Wi‑Fi as your Mac is **not** required if you use tunnel (below).

### On your Mac (one-time)

```bash
cd /path/to/keit
npm install
npx expo start --tunnel
```

Scan the QR code with Expo Go (iPhone: Camera app; Android: Expo Go app).

Before starting, create a file `.env` in the project root:

```
EXPO_PUBLIC_API_URL=https://keit-six.vercel.app
```

So the app on your phone talks to your live Vercel API, not localhost.

**Note:** Your Mac must stay running with `expo start` while friends use Expo Go — for 50 friends, prefer **Step 4 (browser)** or a proper **TestFlight / Play internal test** build later.

---

## Quick checklist

- [ ] Code pushed to GitHub (`api/`, `lib/`, `prisma/` included)
- [ ] Vercel redeployed
- [ ] `/api/health` returns OK (not 404)
- [ ] `DATABASE_URL` + JWT secrets set on Vercel
- [ ] `npm run db:push` run against Supabase
- [ ] Signup tested on phone browser
- [ ] (Optional) Expo Go + `.env` with `EXPO_PUBLIC_API_URL`

---

## If something breaks

| Symptom | Likely cause |
|---------|----------------|
| `/api/health` → 404 | Backend not deployed — push `api/` to GitHub |
| `/api/health` → 503, db error | Wrong `DATABASE_URL` or `db:push` not run |
| Signup fails “network” | Phone app missing `EXPO_PUBLIC_API_URL` |
| OTP never arrives | SMS not configured — use dev OTP in logs or add Africa’s Talking keys |

---

## What you do NOT need for beta v1

- App Store / Play Store listing
- Julaya production keys (wallet can work K21-to-K21 without mobile-money deposit)
- Full Mbolo / Discover rebuild

You **do** need: pushed code + Supabase + Vercel env vars + health check green.
