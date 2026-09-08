# Joko — wallet

West African youth wallet + Mboolo + marketplace. **Senegal first (Phase 1).**

**KEBU** (B2B commerce website) is a **separate project** — not this repo. Joko is the wallet; shops plug in via the **[Partner API](docs/JOKO-PARTNER-API.md)** (`/api/v1/checkout/sessions`, webhooks, `/api/v1/messages/send`).

## Repo layout

```
src/           ← React Native / Expo frontend (match /design prototypes)
design/        ← HTML screen prototypes + design-brief.md
api/           ← Vercel serverless functions (one file per route)
lib/           ← Shared backend logic (Kori, Julaya, handlers, Prisma)
prisma/        ← PostgreSQL schema (Neon / Supabase / Vercel Postgres)
docs/          ← Build specs
server/        ← Legacy Express server (superseded by /api — do not use for new work)
```

## Architecture

Frontend and backend deploy as **one Vercel project**:

- Expo web export → static `dist/`
- `/api/*` → serverless functions on the same domain
- Frontend calls relative paths: `fetch('/api/wallet')`, `fetch('/api/transfers/send', { method: 'POST', ... })`

Database is **hosted Postgres** (no SQLite — serverless has no persistent local disk).

## Start here (Cursor agents)

1. **Wallet & payments spec:** [`docs/K21-BUILD-SPEC.md`](docs/K21-BUILD-SPEC.md)
2. **Regulatory & Kori:** [`docs/K21-REGULATORY-STRATEGY.md`](docs/K21-REGULATORY-STRATEGY.md)
3. **Design system:** [`design/design-brief.md`](design/design-brief.md)
4. **Frontend data contract:** [`src/state/AppState.js`](src/state/AppState.js) — wire to `/api/*` when ready

## API routes

| Method | Path |
|--------|------|
| GET | `/api/health` |
| POST | `/api/auth/phone`, `/api/auth/verify`, `/api/auth/refresh`, `/api/auth/complete-profile` |
| GET | `/api/me`, `/api/wallet`, `/api/transactions` |
| POST | `/api/transfers/send`, `/api/transfers/request` |
| GET | `/api/transfers/requests` |
| POST | `/api/transfers/requests/[id]/accept`, `.../deny`, `.../cancel` |
| POST | `/api/cash/in`, `/api/cash/out` |
| GET | `/api/cash/transactions` |
| POST | `/api/deposits/national`, `/api/kori/convert` |
| GET | `/api/kori/transactions`, `/api/kori/reserve` |
| POST | `/api/merchants/[id]/pay` |
| … | See `api/` folder for full list |

## Run locally

```bash
# Frontend (Expo)
cp .env.example .env   # set DATABASE_URL + JWT secrets for API if testing DB routes
npm install
npm start

# Database (once per schema change)
npm run db:push

# Web preview (same as Vercel static export)
npm run web
```

For local API testing, use `vercel dev` (install Vercel CLI) so `/api` routes run alongside the Expo web app on one port.

### Pre-launch tests (required before real money)

```bash
npm run test:db:start    # local Postgres (Prisma dev)
npm run test:db:setup
npm run test:launch-gate # unit + integration + security + load
```

See [`docs/K21-BUILD-SPEC.md`](docs/K21-BUILD-SPEC.md#pre-launch-test-gate-real-money) for the full gate checklist.

Deploy: connect repo to Vercel, set `DATABASE_URL` (Supabase Postgres URL works), JWT secrets, run `npm run db:push`. See [`docs/K21-GET-ONLINE.md`](docs/K21-GET-ONLINE.md).

## Rules

- Do **not** add demo/seed users or fake balances.
- Match design prototypes — `#050805` background, `#1af060` green, Unbounded + Outfit.
- Kori (₭) is closed-loop stored value — not crypto.

Branch: `claude/k21-phase-1-scope-wnk8gf` · Remote: [`mbayangxo/joko`](https://github.com/mbayangxo/joko)
