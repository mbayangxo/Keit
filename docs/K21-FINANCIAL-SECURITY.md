# K21 Financial Security Spec

**Mandatory for every feature that touches money or user balances.**

> Before writing any feature that touches money or user balances, read and apply all rules in this document. Every transaction must be atomic. Every API call must handle failure. Every balance update must be validated. Security requirements are not optional — they apply to every screen and every function. **If you are unsure whether something is secure, stop and ask before proceeding.**

---

## 1. Atomic transactions (non-negotiable)

A money operation either **completes fully** or **does not happen at all**. There is no in-between.

**Required pattern for every balance change:**

1. `BEGIN` — `prisma.$transaction` via `runMoneyTransaction()` in `lib/wallet-atomic.js`
2. `SELECT … FOR UPDATE` — lock affected wallet rows with `lockWallets()` (sorted id order to prevent deadlocks)
3. **Balance check on locked rows** — throw `InsufficientFundsError` before debiting
4. Debit + credit + ledger (and Kori tx if applicable) in the **same** transaction
5. `COMMIT` or full `ROLLBACK` on any failure

**Never:**

- Update sender balance without crediting recipient in the same transaction
- Debit a wallet before a partner API confirms success (cash-out: debit only after `completed`, or via webhook settlement)
- Mint Kori without increasing reserve XOF in the same transaction (`applyCirculationIncrease`)

**Use:** `transferNational`, `transferKori`, `debitNational`, `creditNational` from `lib/wallet-atomic.js` — do not hand-roll balance updates.

### 1b. Undo window (60 seconds)

P2P sends and merchant payments register a `TransferUndo` row **in the same transaction** as the transfer (`createTransferUndoInTx`). Reversal via `POST /api/transfers/:reference/undo` runs a **new** atomic `transferNational` in the opposite direction (recipient → sender). If the recipient already spent the funds, undo fails with a clear error — no partial state.

---

## 2. Balance validation (before and after)

Every outbound operation must validate:

| Check | Where |
|-------|--------|
| Sufficient balance | `InsufficientFundsError` inside locked transaction |
| Tier daily send cap | `assertCanSend()` — Tier 1: 10k XOF/day |
| Tier cash-out allowed | `assertCanCashOut()` — Tier 1: blocked |
| Wallet hold caps | `assertWalletWithinCaps()` / `assertCanReceive()` |
| International / business | `assertCanInternational()`, `assertCanCreateBusiness()` |
| High-value step-up | `assertStepUpForAmount()` — re-auth above 50,000 XOF |
| Fraud / velocity | `gateOrExecute()` — hold (HTTP 202), do not reject silently |

Record daily usage after success: `recordDailySend()`, `recordDailyCashOut()`.

**Never trust client-supplied `userId`, `walletId`, or `balance` — identity comes from JWT (`req.userId`) only.

---

## 3. Kori reserve accounting

Invariant: `totalReserveHeldXof === totalKoriInCirculation × 10`

- **Mint / earn:** `applyCirculationIncrease(tx, koriAmount)` in the same transaction as wallet credit
- **Convert / burn:** `applyCirculationDecrease(tx, koriAmount)` via `convertKoriToNational()`
- **Reconciliation:** hourly cron `reconcileKoriReserve()` — on mismatch, freeze conversions (`conversionsFrozen`)
- **Unbacked Kori increase:** held for manual review (`kori_unbacked_increase` flag)

Never increment `wallet.koriBalance` without going through `lib/kori-service.js` or an audited path that updates reserve.

---

## 4. External API failure handling

Partner APIs (Julaya, LemFi) can timeout, return 5xx, or drop mid-request. **Ambiguous failure = PENDING, not failed, not completed.**

| Outcome | Action |
|---------|--------|
| 2xx success | Settle wallet in DB transaction |
| 4xx explicit rejection | Mark rail `failed`, **no** wallet debit on cash-out |
| 5xx / timeout / network drop | Mark rail `pending`, user message: processing confirmation within 5 minutes |
| Webhook arrives later | `settleRailFromWebhook()` — idempotent, debit/credit exactly once |

**Use:** `fetchExternalJson()` in `lib/external-fetch.js` (30s timeout, 3 retries, 5s gap).  
**Use:** `startCashIn` / `startCashOut` in `lib/rail-service.js` — do not call Julaya directly from handlers.

**Idempotency:** every partner call gets `generateIdempotencyKey()` + `claimIdempotencyKey()` — replays return cached response, never double-spend.

---

## 5. Fraud holds (not silent blocks)

When risk rules fire, the transaction is **held** (HTTP 202), not rejected and not processed:

- User message: *"Nous vérifions cette transaction pour votre sécurité…"*
- Admin alerted via `FraudAlert`
- Human approves → `approveHeldTransaction()` executes payload once
- Human rejects → no money moves, user notified

**Wrap all money-moving handlers** with `gateOrExecute()` in `lib/risk-gate.js`.

Velocity limits (see `lib/risk-constants.js`): >10 tx/hour, >500k XOF/24h, repeat same amount/recipient, 2am–4am Dakar large tx, device checks, Kori convert >50k XOF.

---

## 6. Authentication & session security

| Rule | Implementation |
|------|----------------|
| HTTPS only in production | `enforceHttps()` in `api/_lib/http.js` |
| JWT access token | `getUserIdFromRequest()` — no user id from body/query |
| 30 min inactivity | `assertAccountAccessible()` — 401 `session_inactive` |
| PIN (bcrypt, min 6 digits) | `lib/pin-service.js` — 5 failures → lock, CNI unlock |
| Step-up for >50k XOF | `X-Step-Up-Token` header |
| Rate limit | 100 req/min/user — `enforceRateLimit()` |
| API audit log | every call logged with userId, path, status |
| Device verification | `X-Device-Id` — new device requires OTP before money moves |

**Mobile:** sensitive data in Expo SecureStore only — never AsyncStorage for tokens, PIN, or balances. Screenshot block on balance/confirm screens.

---

## 7. Data protection

- Sensitive fields at rest: AES-256-GCM (`lib/field-crypto.js`) — keys in env only
- CNI number: hashed (`lib/cni-hash.js`), never plaintext in DB
- KYC images: purged within 24h (`api/cron/kyc-purge`)
- SQL: Prisma parameterized queries only — validate inputs with Zod in handlers

---

## 8. Implementation checklist (every money feature)

Before merging code that touches balances:

- [ ] Uses `runMoneyTransaction` + `lockWallets` (or existing service that does)
- [ ] Checks sufficient balance **after** row lock
- [ ] Tier limits asserted before execution
- [ ] Wrapped in `gateOrExecute` if outbound money
- [ ] Step-up checked if amount ≥ 50,000 XOF
- [ ] Partner calls use `fetchExternalJson` + idempotency keys
- [ ] Ambiguous partner failure leaves wallet unchanged
- [ ] Kori changes update reserve in same transaction
- [ ] Handler validates with Zod; identity from JWT only
- [ ] Tests added or extended in `tests/unit`, `tests/integration`, or `tests/security`

---

## 9. Pre-launch gate

Do not enable live payment keys until:

```bash
npm run test:launch-gate
```

See [`K21-BUILD-SPEC.md`](K21-BUILD-SPEC.md#pre-launch-test-gate-real-money) for suite details.

Start production with **small limits**; raise only after clean reconciliation logs.

---

## 10. When to stop and ask

Stop and get explicit approval before proceeding if:

- You need to update a balance outside `wallet-atomic.js` / `kori-service.js` / `rail-service.js`
- You want to debit before partner confirmation
- You want to skip fraud gate, tier limits, or step-up for convenience
- You are storing financial data in AsyncStorage or logging amounts/tokens
- You are adding a new money path without idempotency
- You are unsure whether a race condition or double-spend is possible

**If in doubt, it is not secure enough for real money.**

---

## Reference modules

| Concern | Module |
|---------|--------|
| Atomic wallet ops | `lib/wallet-atomic.js` |
| Kori mint/convert/earn | `lib/kori-service.js`, `lib/kori-reserve.js` |
| Julaya / rails | `lib/rail-service.js`, `lib/julaya.js` |
| LemFi international | `lib/lemfi.js` |
| External fetch resilience | `lib/external-fetch.js` |
| Idempotency | `lib/idempotency.js` |
| Fraud gate | `lib/risk-gate.js`, `lib/risk-engine.js`, `lib/held-transaction-service.js` |
| Tier limits | `lib/tier-service.js`, `lib/tier-limits.js` |
| Step-up / session | `lib/step-up.js`, `lib/session-security.js` |
| PIN / encryption | `lib/pin-service.js`, `lib/field-crypto.js` |
| HTTP middleware | `api/_lib/http.js`, `api/_lib/auth.js` |
