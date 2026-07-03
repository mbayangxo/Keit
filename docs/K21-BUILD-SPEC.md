# K21 — Complete Wallet & Payments Build Spec

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
| **Frontend contract** | `/src/state/AppState.js` | Wire to `/api/*` (session restore + wallet refresh) |
| **Legacy** | `/server` | Old Express app — **do not use** |

**Deploy:** One Vercel project (Expo web export + `/api`). See [`docs/K21-GET-ONLINE.md`](K21-GET-ONLINE.md).

**Do not edit `/src` for backend-only work.** Wire the app to existing `/api` routes when connecting features.

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

**Backend today:** `POST /transfers/request` creates notification only — **no accept/deny endpoints yet**.

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

## COMMUNICATION (inside K21)

- **Voice notes:** hold-to-record, inline play, no file download UX
- **Voice calls:** K21↔K21 over data, free
- **Video calls:** same infra as voice
- **Money request + voice:** voice note instead of typed reason
- **Group voice notes:** same mechanic in Mboolo groups

**Planned infra:** Stream or Sendbird for RTC + messaging. **Backend today:** basic MBLOL threads/messages in `/server` — not production chat.

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

## ÑU LEKK (group buying)

- From Mboolo: "On mange ensemble?"
- Set per-person amount · one-tap contribute · pool to buyer · buyer pays merchant
- Split history for all · auto-refund if goal not met by deadline

**Backend today:** not implemented.

---

## KORI (₭) — full spec

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
Tontine · Ñu Lekk · Voice notes · Money request accept/deny · LemFi international · Events/tickets · Cayor Market + rider signup

### Within 6 months
Family wallet locks · Voice/video calls · Float · Agent network · Rider dispatch · Full Kori earn

### Year 2
Rect Sound · Alkebulan ID · TAALI · K21 Pass card · Défis · Leaderboards · K21 Junior · Xel ak Sago · Ataya rooms · Cayor checkpoints

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
| Money request (create only) | ✅ |
| Money request accept/deny/cancel | ✅ |
| Family wallet locks | ❌ |
| Tontine (basic) | ⚠️ partial |
| Ñu Lekk | ❌ |
| Merchant pay XOF/₭ | ⚠️ partial |
| QR / offline token | ❌ |
| Julaya / LemFi rails | ⚠️ Julaya adapter (sandbox + live boundary) |
| Voice/video / Stream | ❌ |
| Float | ❌ |
| Wakhna points | ❌ |
| Events/tickets | ⚠️ basic |
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

*Last updated: July 2026 — consolidated from product sessions.*
