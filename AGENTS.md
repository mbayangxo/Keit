# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## K21 project context

Before building, read:

1. [`docs/K21-FINANCIAL-SECURITY.md`](docs/K21-FINANCIAL-SECURITY.md) — **mandatory before any money or balance code** (atomic tx, failure handling, validation, fraud, Kori reserve)
2. [`docs/K21-BUILD-SPEC.md`](docs/K21-BUILD-SPEC.md) — wallet, Kori, payments, Year 1 priorities, what's built vs planned
3. [`docs/K21-REGULATORY-STRATEGY.md`](docs/K21-REGULATORY-STRATEGY.md) — BCEAO path, closed loop vs licensed rails, honest Kori messaging
4. [`design/design-brief.md`](design/design-brief.md) — locked design system
5. Root [`README.md`](README.md) — Vercel `/api` serverless + Postgres architecture
6. [`docs/K21-QUALITY-CONTROL.md`](docs/K21-QUALITY-CONTROL.md) — Sentry, UptimeRobot, morning admin checklist
7. [`docs/K21-ACCESSIBILITY.md`](docs/K21-ACCESSIBILITY.md) — low data mode, large text, receipt sharing, undo window
8. [`docs/K21-CURSOR-MASTER.md`](docs/K21-CURSOR-MASTER.md) — phased build gates, architecture rules, acceptance criteria
9. [`docs/K21-GET-ONLINE.md`](docs/K21-GET-ONLINE.md) — Supabase + Vercel deploy checklist (non-developers)

### Financial security gate (required)

Before writing any feature that touches money or user balances, read and apply all rules in the **K21 Financial Security spec**. Every transaction must be atomic. Every API call must handle failure. Every balance update must be validated. Security requirements are not optional — they apply to every screen and every function. **If you are unsure whether something is secure, stop and ask before proceeding.**

**Frontend contract:** `src/state/AppState.js` — wire to relative `/api/*` paths on deploy.  
**Backend:** `api/` (routes) + `lib/` (logic) + `prisma/` — do not edit `src/` unless explicitly wiring the app to the API.  
**Legacy:** `/server` Express app is superseded; do not use for new work.
