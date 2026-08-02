# K21 — Cursor master instructions

**Paste this context before large features.** Break work into phases — never “build everything” in one task.

## What K21 is

Senegal-first **digital life coordination**: money + Mboolo (community) + Discover + Movement + Commerce. Not a bank app. Not WhatsApp. Not Uber.

## Repo truth (do not hallucinate)

| Layer | Path | Notes |
|-------|------|--------|
| Backend | `api/` + `lib/` + `prisma/` | Vercel serverless + Postgres |
| Frontend | `src/` + `App.js` | Expo 57 — wire to `/api/*` |
| Design | `design/design-brief.md`, `design/*.html` | Locked UI |
| Legacy | `server/` | **Do not use** for new work |
| Money code | `lib/wallet-atomic.js` | Mandatory — see `docs/K21-FINANCIAL-SECURITY.md` |

## Core architecture rules

1. **Modular** — each domain in `lib/<domain>-service.js`, thin `api/` routes.
2. **Connect through** — `User` identity, `Wallet`, `country` + city, Mbolo `groups`.
3. **No orphan features** — every feature must support ≥1 of: **money flow**, **community engagement**, **real-world action**.
4. **Backend is source of truth** — frontend is a dumb client; **no UI step without API validation**.

## Fintech (non-negotiable)

- OTP verified **server-side** only (`POST /api/auth/phone` → `POST /api/auth/verify`).
- No wallet balance patches — use `transferNational`, `debitNational`, `creditNational` inside `runMoneyTransaction`.
- Rail txs: `pending → completed | failed` via `lib/rail-service.js`; undo window via `lib/transfer-undo-service.js`.
- Payment UI: **never** hardcode Orange / Free / Wave — use `lib/payment-config.js` + generic “Mobile Money”.
- Audit: `AdminAuditLog`, `LedgerEntry`, `SecureLog`, Sentry on 500s.

## Localization

- `LocaleContext` — `country`, `language` (`fr` | `en` | `wo`), `currency`, `onboardingIntent`.
- All onboarding strings via `t(lang, key)` from `src/i18n/translations.js`.
- Country drives dial code, currency display, diaspora flag.

## Phased delivery (use one phase per Cursor task)

### Phase A — Auth + onboarding

**Acceptance:**
- [x] Signup calls `/api/auth/phone` and `/api/auth/verify`; tokens saved; no advance on failure.
- [x] Locale persists; language toggle updates onboarding copy.
- [x] Country from onboarding drives phone `+XXX` prefix.
- [x] CNI skipped on default path; profile via `/api/auth/complete-profile`.
- [x] Fund step shows generic “Mobile Money” only.
- [x] Intent step stored (`identityChoice`).

**Do not:** redesign Home, Discover, or Mbolo RTC.

### Phase B — Wallet + transactions

Wire `AppState` to `GET /api/wallet`, `POST /api/transfers/send`. Keep atomic rules.

**Acceptance:**
- [x] Session restore hydrates wallet from API on cold start
- [x] `SendMoneyScreen` calls `POST /api/transfers/send` + `refreshWallet`
- [x] `PayMerchantScreen` / `CashScreen` wired to API
- [x] Send money uses real `@handle` input (recipient must exist in DB)

### Phase C — Mbolo basic

Groups: messaging, announcements, collecte (tontine link). No voice RTC yet.

### Phase D — Discover (commerce browse)

Culture, Eat, Gigs, flash deals — **no event tickets** in main app. Tickets → [`docs/K21-EVENTS-APP.md`](../docs/K21-EVENTS-APP.md).

### Phase D2 — B2B Trade Portal

See [`docs/K21-TRADE-PORTAL.md`](../docs/K21-TRADE-PORTAL.md). Distribution hub, trade accounts, invoices, wholesale checkout.

**Acceptance (phase 1):**
- [x] Brand register + seed products
- [x] B2B checkout + payment terms + KEBU settlement
- [x] Invoice pay + step-up
- [x] Merchant fulfill + rider pickup/deliver
- [ ] Preferred delivery date, COD, routes, traceability, co-op dashboards

### Phase E — Commerce + gigs

`Product`, seller profiles, pay via wallet.

### Phase F — Movement

Delivery exists in schema — wire UI; rides = listings peer-to-peer.

### Phase G — Cron + QC

Already: financial-integrity, pending rails, fraud, daily report. Extend as needed.

## AI rules

AI may: support suggestions, fraud **flags**, discovery ranking, moderation hints.  
AI may **not**: move money, approve txs, bypass auth, change balances.

## Onboarding state machine (target)

```
country+language → phone → OTP (API) → profile → intent → arrondissement → fund (optional) → PIN → main
```

No `Main` without valid JWT from `auth/verify`.

## Product principle

Users should feel they open **their country and community**, not a form. Living feed on Home is Phase D+ — after trust works.
