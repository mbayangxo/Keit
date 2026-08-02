# K21 — Payment infrastructure for Senegal

**K21 is the payment infrastructure for Senegal** — the platform every future K21 app runs on. Wallet, marketplace, and Mboolo share one ledger, one API, and one identity. Rect and partner apps are clients of this platform; they do not implement their own money layer.

**For Cursor agents.** This document consolidates product, regulatory, and implementation context across sessions.

---

## Architecture (actual repo — read this first)

| Layer | Location | Stack |
|-------|----------|--------|
| **Frontend** | `/src`, `App.js` | React Native + Expo 57. Match `/design` prototypes. |
| **Design prototypes** | `/design/*.html` | Pixel reference for screens |
| **Product brief** | `/design/design-brief.md` | Locked design system + app structure |
| **Backend API** | `/api` + `/lib` | Vercel serverless + Node; **source of truth** |
| **Database** | `/prisma` | Postgres — **Supabase, Neon, or Vercel Postgres** via `DATABASE_URL` |
| **Scheduled jobs** | `/api/cron/*` | Vercel Cron; optional Supabase pg_cron triggers same URLs |
| **Product docs** | `/docs/K21-*.md` | [`K21-TRADE-PORTAL.md`](K21-TRADE-PORTAL.md) · [`K21-EVENTS-APP.md`](K21-EVENTS-APP.md) |
| **Frontend contract** | `/src/state/AppState.js` | Wire to `/api/*` (session restore + wallet refresh) |
| **Legacy** | `/server` | Old Express app — **do not use** |

**Deploy:** One Vercel project (Expo web export + `/api`). See [`docs/K21-GET-ONLINE.md`](K21-GET-ONLINE.md).

**Do not edit `/src` for backend-only work.** Wire the app to existing `/api` routes when connecting features.

---

## K21 vs Rect (two apps, one platform)

**K21 is payment infrastructure for Senegal** — the app (and API) for **wallet**, **marketplace** (anything you pay for), and **Mboolo** (chat + voice/video calls). **Rect** is identity and culture on top of that platform — not a second wallet.

**Locked product split:**

| | **K21** | **Rect** |
|---|---------|----------|
| **What it is** | Infrastructure — **wallet**, **marketplace**, **Mboolo** | Social — who you are, clubs, culture, creator presence |
| **User promise** | “Pay for life — send money, order, ride, shop, eat, deliver” | “My space in the African digital world” |
| **Surfaces** | **Wallet** · **Marketplace** · **Mboolo** (messages, voice notes, **voice & video chat**) | Lounge, clubs, Tendances, … (checkout → K21) |
| **App store** | Separate install (primary) | Separate install (`Rect`) |
| **Runs on** | Platform owner (ledger + compliance) | **K21 platform** (same backend — not a second ledger) |

### Three surfaces in K21 (do not merge)

| Surface | Job | Examples |
|---------|-----|----------|
| **Wallet** | Balances & P2P / cash rails | Send to @handle, receive, Cash in/out, tontine, pay merchant QR |
| **Marketplace** | **Paid commerce & work** — one place for “I pay for something” | Delivery (Mouvement), rides, driver gigs, seller shop, **B2B trade portal**, cooperative payouts, Ñu Lekk settle-to-merchant, Cayor market orders |
| **Mboolo** | **Chat & calls** — messages, voice notes, photos, stickers, **voice call, video call**, groups | Friends, DMs, group threads; 📞/🎥 from chat header; optional receipt *share* only |

**Rule:** If it **costs money** and is a **product, ride, delivery, or job** → **marketplace** (+ wallet settlement). **Event tickets** → separate **K21 Events** app ([`K21-EVENTS-APP.md`](K21-EVENTS-APP.md)). If it **moves money person-to-person** → **wallet**. If it **messages or calls (voice/video)** → **Mboolo**.

Discover/Tendances in this repo today is wired into the **Marketplace** tab — paid commerce and regional alerts. Long term **Rect** owns culture browse; **K21 marketplace** owns the paid side (order, deliver, ride, checkout).

**Bottom nav (K21 app):** Accueil · Mboolo · Marketplace · Alertes · Moi. Wallet actions live on Accueil (+ **Plus** sheet); paid commerce on Marketplace; chat/calls on Mboolo.

### Mboolo ≠ wallet

**Do not describe Mboolo as “where you send money.”** They are separate surfaces in one app:

| | **Wallet** | **Mboolo** |
|---|------------|------------|
| **Purpose** | Balances, transfers, cash, merchant pay, receipts | Talk to people — text, voice notes, images, groups, **voice & video calls** |
| **Primary UI** | Accueil wallet, Send / Receive / Cash, **Plus** (MoreActions) | **Mboolo** tab, chat threads, **Call** screen (📞 / 🎥) |
| **Money** | All ledger movement happens here (with safety confirm, PIN, etc.) | Optional hooks only — e.g. share a receipt, *future* “request ₭” → **Receive** — not a balance UI |

Mboolo is **WhatsApp-class messaging + calls inside K21** (including **video chat**), not a payment surface. Wallet stays the single place for balance and moving money.

**“Runs on K21” means Rect never implements its own money layer.** Shared infrastructure:

- One **Postgres** (`/prisma`) — `User`, `Wallet`, ledger, verification
- One **API** (`/api` + `/lib`) — auth JWT, `/transfers/*`, `/deposits/*`, `/mbolo/*`, `/trending/*`, etc.
- One **identity** — `@handle`, AFRI ID, tiers; Rect reads profile; K21 owns KYC/fraud
- **Pay flows** — Rect triggers K21 (deep link, app switch, or in-app wallet sheet); settlement always hits K21 APIs

**Cross-app flows (target):**

- Rect: pay / buy ticket / tip creator → **K21 wallet** (Accueil, Payer, Send — not Mboolo) — *ticket purchase UI moves to **K21 Events** app*
- Rect: “Message @awa” → **K21 Mboolo** (chat lives in K21, not Rect)
- K21 wallet: optional **post to Mboolo** after send (receipt card in thread) — convenience, not required
- Shared session: same refresh token / SSO where OS allows (Universal Links / App Links)

**This repo today:** the Expo app in `/src` is **K21** — wallet + **Mboolo** + (for now) Discover/Tendances screens that will eventually move to the Rect app. Do not remove Mboolo from K21. New **Mboolo** work stays in this app + shared `/api/mbolo/*`. New **Lounge / culture / creator** surface targets Rect when that app exists.

**Regulatory:** all balance changes, deposits, and payouts stay in K21 handlers with [`K21-FINANCIAL-SECURITY.md`](K21-FINANCIAL-SECURITY.md). Rect is a client of that API, like a third-party app would be — but first-party, same team.

---

## Design system (locked)

- Background: `#050805` (ink)
- Primary green: `#1af060`
- Gold: `#f7b731` · Orange: `#ff6422`
- Display font: **Unbounded** · Body: **Outfit**
- Kori color: `#1af060` · Symbol: **₭** (always `₭1,000` format, never `1000 Kori`)
- Everything animates. Warm, alive, Senegalese — not cold fintech.

---

## Regulatory & rollout

### Kori (₭)
- Closed-loop **stored value instrument** — not crypto, no blockchain
- **No separate BCEAO license** under stored-value rules
- ₭1 = 10 XOF (Senegal + all WAEMU); ₭1 = 10 NGN; ₭1 = 1 GHS
- Reserve: 10 XOF held per ₭1 minted from national deposits
- Cross-border ₭ sends: universal, instant, zero conversion visible to user

### Phase 1 — Senegal only
- Domestic rails: **Julaya** or **Pawapay** (BCEAO-licensed)
- K21 BCEAO application: in process
- International: **LemFi** or **Sama Money**
- Kori: internal ledger only

### Phase 2 — WAEMU (8 countries)
- Same Julaya/Pawapay infra; shared XOF; identical ₭ mechanics

### Phase 3 — Nigeria / Ghana / Gambia
- Flutterwave/Paystack (NG), MTN MoMo (GH)
- Cross-bloc national conversion internal to K21; ₭ stays universal

See `server/src/lib/regulatory.ts` and `server/README.md` for rail placeholders.

---

## SEND MONEY (Yónnee)

- Send to any K21 user by **name, @handle, or phone**
- Send in **XOF** or **₭ Kori**
- **Safety confirmation** before money moves:
  - Recipient photo, full verified name, phone, arrondissement, amount, reason
  - Confirm: *"Oui c'est bien [Name] — Envoyer"*
  - Cancel (red): *"Ce n'est pas la bonne personne"*
- Zero fees on domestic K21→K21
- Success: celebration + receipt
- Wakhna points on every send
- Earn **₭2** per send (backend)

**Backend today:** `POST /transfers/send` with `currency: "national" | "kori"`. Safety screen is frontend-only until profile photos/KYC fields exist.

---

## RECEIVE MONEY (Jël)

- Request money with **context** ("pour le taxi", etc.)
- Recipient: **accept one tap** or **deny one tap** (no explanation required)
- Requester notified of accept/deny
- Optional **voice note** on request (more personal than typing)

**Backend today:** `POST /transfers/request`, `POST /transfers/requests/:id/accept|cancel`, inbox in Receive screen, notifications with `refId`.

---

## FAMILY LOCK (Rate Lock)

Family Wallet for mother, child, spouse, etc. Framed as **"Protège ta famille"** — care, not surveillance.

| Lock type | Behavior |
|-----------|----------|
| **Monthly allowance** | Fixed amount auto-releases on set date; no extra until next month |
| **Category lock** | Spend only at merchant types (food, pharmacy, etc.) |
| **Merchant lock** | Spend only at one registered merchant (e.g. school fees) |
| **Per-tx limit** | Max amount per single transaction |
| **View only** | Beneficiary sees balance; only holder can release |

**Backend today:** not implemented — needs `FamilyWallet`, lock rules, and spend validation on pay endpoints.

---

## Mboolo (chat + calls)

All of this lives in the **Mboolo** tab — not wallet, not marketplace.

- **Messages:** text, images, GIFs, stickers, voice notes (hold-to-record, inline play)
- **Voice calls:** 📞 1:1 and group threads — K21↔K21 over data (LiveKit; see [`docs/K21-CALLS-LIVEKIT.md`](K21-CALLS-LIVEKIT.md))
- **Video calls:** 🎥 same rooms as voice — tap from chat header or join card in thread
- **Friends & groups:** DMs, group threads, @handle invites
- **Optional:** share transfer receipt in thread; money requests stay **wallet / Receive**, not inline pay in chat

**Backend today:** `/api/mbolo/*` threads + messages; `POST /api/calls/token` mints LiveKit room per thread. **Web first** for calls; native needs custom dev build.

---

## MERCHANT PAYMENTS (Fey)

- QR scan → pay registered merchant
- **Offline token:** balance verified first, funds soft-reserved, settle on reconnect
- Merchant: distinct payment sound + large-text amount + sender photo
- Customer: zero fees · Merchant: **0.5–1%** (invisible to customer)
- Pay in XOF or ₭

**Backend today:** `POST /merchants/:id/pay` (business owner wallet). QR/offline token/merchant fee not implemented.

---

## TONTINE DIGITALE

- Create group, amount, frequency (weekly/bi-weekly/monthly), rotation
- Auto-collect on date · auto-release to turn holder
- Full transparency · 48h missed-payment reminder · hardship vote to pause
- Permanent history

**Backend today:** basic create/contribute/release — no auto-schedule, reminders, or voting.

---

## ÑU LEKK (food bill split)

- Standalone flow (not Mboolo chat or group threads): split a restaurant bill after eating together
- Organizer sets total bill + per-person share · invite by link or @handle
- One-tap pay your part · pool releases to merchant (or organizer pays merchant) when complete
- Split history for all · auto-refund if not fully paid by deadline

**Backend today:** not implemented.

---

## Scheduled jobs (cron)

**Vercel schedule (`vercel.json`):**

| Cron URL | Schedule | What runs |
|----------|----------|-----------|
| `/api/cron/daily` | `0 6 * * *` (06:00 UTC daily) | **All** jobs below in one batch (`runAllDailyCronJobs`) |
| `/api/cron/scheduled-payments` | `0 * * * *` (hourly) | Recurring scheduled payments only |

**Jobs inside daily batch** (`lib/cron/http-handlers.js`):

| Job | Purpose |
|-----|---------|
| `financial_integrity` | Kori reserve vs ledger sanity |
| `pending_transactions` | Stuck rail txs → resolve or fail |
| `fraud_monitor` | Velocity / hold review |
| `tontine_processor` | Auto collect / rotate *(partial product)* |
| `rider_status` | Mark stale riders offline |
| `daily_financial_report` | Admin report snapshot |
| `delivery_auto_release` | Release escrow after confirm window |
| `kyc_purge` | Expired KYC image metadata |
| `payroll_processor` | Scheduled business payroll runs |
| `scheduled_payments` | Also runs in daily batch *(hourly route is primary)* |
| `agent_monthly_payout` | Agent commission payout |
| `school_fee_reminders` | Fee period nudges |
| `youtube_chart_refresh` | Charts cache |

**Manual / on-demand:** Each job also exposed at `GET|POST /api/cron/<name>` with `CRON_SECRET` header (`lib/cron-auth.js`).

**Gaps (honest):**

- No cron for **trade invoice overdue reminders**, **B2B route planning**, or **delivery SMS ETA** — planned with Trade Portal phase 3
- Hobby plan = **one daily** + **one hourly** Vercel cron; everything else relies on daily batch or manual ping
- `api-disabled/cron/*` duplicates are **legacy** — live router is `lib/api-router.js` → `lib/cron/http-handlers.js`

---

## B2B Trade Portal (distribution)

Full product spec: [`docs/K21-TRADE-PORTAL.md`](K21-TRADE-PORTAL.md)

**Mantra:** Order · Pay · Deliver · Track · Share

**Built in this repo (Aug 2026):**

- Brand registration + default agro catalog (granulés, beurre de cacahuète)
- B2B/B2C channels, wholesale pricing, trade accounts, invoices (net15/30/monthly)
- Checkout → supplier **KEBU**; invoice pay with step-up
- Merchant order fulfillment + rider pickup/deliver in Mouvement
- Business Hub → Distribution hub + payroll link

**Not built yet:** GPS route board, SMS ETA, proof-of-delivery photo, batch QR traceability, worker/co-op equity dashboards, 30-day price lock subscription.

**UI entry:** Marché → **Distribution** · Business Hub → **Hub distribution** · **Factures B2B** · B2B shop checkout (date + COD)

---

## Worker profile (travailleur) & marketplace

K21 **marketplace** covers delivery, riding, gigs, seller orders, and any paid service — not a separate product per vertical.

- **Not a signup type** — personal accounts activate worker from **Moi → Profil travailleur** or **Mouvement**
- **Business accounts** cannot activate worker (separate KEBU business signup)
- **Modes:** delivery, seller, rides/gigs (Mouvement)
- Escrow on delivery → release on confirm; disputes + admin resolve
- Completed paid jobs → **WorkerReceipt** (`WR-…`) for loan documentation
- **Credit tier**: starter → building → established
- APIs: `/workers/*`, `/deliveries/*`, seller/market routes, `/distribution/*` trade

**Backend today:** ✅ delivery escrow + receipts; ✅ B2B trade + KEBU settlement; seller/gig — partial; Movement UI wired for accept → pickup → deliver.

---

- Dual balance: national + ₭ on every wallet
- Mint on national deposit (10,000 XOF → 10,000 XOF + ₭1,000)
- Earn: send ₭2, merchant ₭5, referral ₭50, delivery ₭10, onboard merchant ₭100
- Spend/send at merchants and users globally in ₭
- Convert ₭→national at **2% fee**
- Reserve: 10 XOF per ₭1 minted from deposits

**Backend today:** implemented in `/server` — see `server/README.md`.

---

## INTERNATIONAL TRANSFER

- LemFi or Sama Money API under K21 UI
- Corridors: France, US → Senegal wallet or national
- Rate upfront · K21 revenue share

**Backend today:** not implemented.

---

## FLOAT (send before payday)

- Diaspora users 3+ months history
- Send home before payday; repay bi-weekly from balance
- Fee 500–1,000 XOF · limit ~$165 equivalent for new users
- Family can request; diaspora approves one tap · auto-deduct

**Backend today:** not implemented.

---

## CASH IN / CASH OUT

- Orange Money, Free Money via **Julaya API**
- K21 agent points for in-person · agent commission

**Backend today:** `POST /deposits/national` simulates deposit + Kori mint. No Julaya integration.

---

## ACCOUNT SECURITY

- CNI-linked identity (not SIM)
- Agent + CNI + biometric recovery (~5 min)
- 2FA for large transfers · biometric + PIN

**Backend today:** `identityChoice` stored at signup; no real KYC/biometric integration.

---

## Year 1 priorities (honest)

### Must have at launch
Send/receive + safety screen · Merchant QR pay · Cash in/out (Julaya) · Basic Mboolo · CNI onboarding · Kori dual balance · Profile

### Within 90 days
Tontine · Ñu Lekk · Voice notes · LemFi international · **Trade portal phase 2** (delivery date, COD, routes) · Cayor Market + rider signup · **K21 Events app** (tickets — separate install)

### Within 6 months
Family wallet locks · Float · Agent network · Rider dispatch · Full Kori earn · native Mboolo video (custom build) · **Trade portal phase 3–5** (traceability, co-op dashboards, price locks)

### Year 2
K21 Charts · Alkebulan ID · TAALI · K21 Pass card · Défis · Leaderboards · K21 Junior · Xel ak Sago · Ataya rooms · Cayor checkpoints

---

## Backend implementation matrix

| Feature | API / schema status |
|---------|---------------------|
| Auth (OTP, JWT, profile) | ✅ `/api` |
| PIN + bcrypt, 30m inactivity, 50k step-up | ✅ |
| Verification tiers 1–3 + CNI KYC (Smile/Sumsub) | ✅ |
| Rate limit 100/min, API audit log | ✅ |
| Fraud holds (velocity, device, Kori) + admin review | ✅ |
| Biometric + SecureStore (mobile) | ✅ |
| SMS balance + receive alerts (offline / feature phone) | ✅ `/api/webhooks/sms/inbound`, `/api/sms/preferences` |
| Scheduled jobs (integrity, pending rails, fraud, tontine, riders, reports) | ✅ `/api/cron/*` + `supabase/migrations` pg_cron |
| Dual balance + Kori mint/convert/reserve | ✅ |
| Send XOF or ₭ | ✅ |
| Earn ₭ on send/merchant/delivery | ✅ |
| Delivery escrow (accept → pickup → deliver → confirm / auto-release) | ✅ `/api/deliveries/*` |
| Delivery disputes + evidence + admin resolve | ✅ |
| Money request (create + accept/deny/cancel) | ✅ |
| B2B trade portal (brand, invoices, wholesale) | ⚠️ phase 1 — [`K21-TRADE-PORTAL.md`](K21-TRADE-PORTAL.md) |
| Distribution fulfillment + rider UI | ✅ |
| Business payroll (KEBU) | ✅ |
| Family wallet locks | ❌ |
| Tontine (basic) | ⚠️ partial — cron exists |
| Ñu Lekk | ❌ |
| Merchant pay XOF/₭ | ⚠️ partial |
| QR / offline token | ❌ |
| Julaya / LemFi rails | ⚠️ Julaya adapter (sandbox + live boundary) |
| Voice/video calls (Mboolo, LiveKit) | ⚠️ web + API; env required |
| Float | ❌ |
| Wakhna points | ❌ |
| Events/tickets in **main K21 app** | 🚫 removed — [`K21-EVENTS-APP.md`](K21-EVENTS-APP.md) |
| Pre-launch test suite (unit / integration / load / security) | ✅ `tests/` |

---

## Pre-launch test gate (real money)

**Do not enable live Julaya / LemFi keys or raise production limits until `npm run test:launch-gate` passes.**

| Suite | Command | What it proves |
|-------|---------|----------------|
| Unit | `npm run test:unit` | Kori math, reserve invariant, tier caps, fraud rules, wallet atomicity, API failure handling |
| Integration | `npm run test:integration` | Julaya sandbox cash-in/out, timeout → pending, webhook settlement, LemFi sandbox, held-tx approve/reject |
| Security | `npm run test:security` | Insufficient balance, forged JWT, cross-user access, PIN lockout, Kori tamper detection, SQLi, HTTPS/HSTS |
| Load | `npm run test:load` | 1,000 concurrent sends, race on one wallet, idempotency storm |
| **All** | `npm run test:launch-gate` | Runs every suite above |

### Local test database

```bash
npm run test:db:start          # Prisma dev Postgres on localhost:51214
npm run test:db:setup          # push schema + generate client
npm run test:launch-gate       # full gate (~7 min on laptop)
```

Tests use `tests/helpers/setup.js` (JWT secrets, `pgbouncer=true` for the dev proxy). Override with `DATABASE_URL` for CI.

### After the gate passes

1. **Start with small limits** — keep Tier 1 caps and fraud holds active in production.
2. **Sandbox first** — `JULAYA_API_KEY_SANDBOX` / `LEMFI_API_KEY_SANDBOX` only until a manual smoke test on staging.
3. **Raise limits gradually** — increase Tier 2 daily cash-out and velocity thresholds only after 2 weeks of clean reconciliation logs.

---

## Cursor workflow

1. **Financial security (money/balances):** [`docs/K21-FINANCIAL-SECURITY.md`](docs/K21-FINANCIAL-SECURITY.md) — read first; atomic tx, failure handling, validation
2. **Frontend screens:** match `/design/*.html` — do not invent layouts.
3. **Wire money:** replace `AppState.js` mocks with relative `/api/*` calls (same domain on Vercel).
4. **New backend features:** extend `prisma/schema.prisma` + `lib/handlers.js` + thin route in `api/`.
5. **No demo seed data** — real accounts only via onboarding.
6. **K21 ≠ BloomBay** — separate product, separate repo (`mbayangxo/keit`).

---

*Last updated: August 2026 — trade portal, cron audit, events split to separate app.*
