# K21 Trade Portal — B2B order · pay · deliver · track · share

**Product mantra:** *Order, pay, deliver, track, and share.*

Any registered **brand / wholesaler / cooperative / manufacturer** can sell to other businesses (restaurants, hotels, schools, farms, merchants). Not only K21 Agro — **multi-tenant** on one platform.

---

## 1. Order portal (buyer side)

**Who:** Restaurant, hotel, school canteen, merchant, farm (buying feed), any business with a KEBU or linked buyer account.

**Flow:**

1. Open **Marché → Distribution** or supplier shop
2. Channel **B2B / Gros**
3. Browse catalog (only products with `saleChannel` b2b or both)
4. Set **quantities** (respect `b2bMinQty`, wholesale unit labels)
5. **Delivery address** + **preferred delivery date** (14-day picker)
6. Choose **payment term**:
   - Comptant (pay now from personal C or KEBU)
   - **À la livraison (COD)** — pay when confirming receipt
   - Net 15 / Net 30 / Monthly invoice
7. Submit → order + optional **TradeInvoice**

**Built today (Aug 2026):**

| Capability | Status |
|------------|--------|
| B2B channel + wholesale pricing | ✅ Shop + catalog |
| Payment terms + open invoice | ✅ `TradeAccount`, `TradeInvoice` |
| Delivery address on order | ✅ marketplace checkout |
| Preferred delivery date | ✅ order field + checkout picker |
| COD (pay on confirm) | ✅ trust tier + limits |
| Credit owed banner (buyer) | ✅ `GET /distribution/trade-summary` |
| Buyer type filters (school/hotel/restaurant) | ⚠️ trade account `buyerType` only |
| Subscription / price lock 30 days | ❌ planned |

---

## 2. Pay

**Settlement paths:**

| From | To | Status |
|------|-----|--------|
| Buyer personal wallet (C) | Supplier **KEBU** | ✅ immediate checkout |
| Buyer pays open invoice | Supplier KEBU | ✅ `POST /distribution/invoices/:id/pay` |
| Buyer KEBU → supplier KEBU | B2B transfer | ⚠️ `transferBusinessFunds` exists; not wired to trade checkout |
| Personal → fund buyer KEBU → pay supplier | Manual two-step | ✅ wallet + business hub |
| **Cash on delivery (COD)** | Pay on buyer confirm → KEBU | ✅ step-up on collect |
| Step-up PIN on large pays | Both sides | ✅ |

**Credit visibility (both sides):**

| View | Status |
|------|--------|
| Buyer: open invoices, amount owed | ✅ TradeInvoices + checkout banner |
| Supplier: open AR by client | ✅ Distribution hub |
| “You owe X from last month” banner | ✅ trade summary API |
| Credit limit enforcement | ✅ at order time |

**Monthly price lock (subscription):**

- Buyer on `monthly` term gets **locked catalog prices for 30 days** *(planned — needs `TradePriceLock` or contract line items)*

---

## 3. Deliver

**Merchant / brand:**

- **Merchant Orders** → preparing → ready / out for delivery
- Links to **DeliveryTask** when fulfillment = delivery

**Driver (Mouvement):**

| Step | Status |
|------|--------|
| Accept nearby job | ✅ |
| Active jobs list | ✅ |
| Mark picked up | ✅ |
| Mark delivered | ✅ |
| Buyer confirm + escrow release | ✅ |
| **Daily route board** — all stops, GPS order | ❌ planned |
| **SMS: “15 min away”** | ❌ planned (SMS infra exists) |
| **Proof of delivery** — photo signed receipt / serial scan | ❌ planned |

---

## 4. Track (batch traceability)

**Buyer or consumer scans QR on product batch:**

| Field | Example (peanut oil) |
|-------|----------------------|
| Cooperative / farm origin | “Coop Cayor Nord” |
| Harvest / press date | ISO date |
| Temperature log | Cold chain readings |
| Worker who processed / bottled | Worker profile link |

**Status:** ❌ not built — needs `ProductBatch`, `BatchTraceEvent`, QR encode in `lib/k21-qr.js`, public trace API.

---

## 5. Share (worker & co-op transparency)

**10% worker-owner (example equity model):**

- Daily output, revenue attributed, **share accrual** dashboard
- No accountant can hide — ledger-backed

**Cooperative dashboard:**

- Tons delivered, payment status, quality grade, member splits
- Tied to existing **cooperative delivery / payout** APIs in Business Hub

**Status:**

| Piece | Status |
|-------|--------|
| Worker receipts / credit tier | ✅ |
| Co-op delivery log + farmer payout | ✅ Business Hub |
| Equity % accrual dashboard | ❌ planned |
| Public co-op transparency portal | ❌ planned |

---

## API map (implemented)

| Area | Routes |
|------|--------|
| Checkout eligibility | `GET /distribution/trade-summary?businessId=` |
| Brand register | `POST /distribution/brand/register` |
| Trade accounts | `GET/POST /distribution/trade-accounts` |
| Invoices | `GET …/invoices/mine`, `…/supplier`, `POST …/pay` |
| Orders | `POST /marketplace/orders` (channel, paymentTerm) |
| Fulfillment | `PATCH …/orders/:id/status`, `POST …/confirm` |
| Delivery | `/deliveries/*`, `GET /deliveries/active/mine` |
| Payroll | `/businesses/:id/payroll/*` |

---

## Build order (recommended)

1. **Preferred delivery date** on order + merchant calendar
2. **COD + trust tier** for new B2B buyers
3. **Route optimizer** + driver day sheet + SMS ETA
4. **POD** photo + optional serial
5. **Batch QR traceability**
6. **Worker/co-op share dashboards**
7. **Monthly price lock** contracts

See [`K21-BUILD-SPEC.md`](K21-BUILD-SPEC.md) implementation matrix for repo-wide status.
