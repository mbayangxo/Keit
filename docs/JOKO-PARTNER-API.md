# Joko Partner API — payments + messaging for African shops

Joko is the **wallet**. Kebu (and other shops) plug in via this Partner API.

Base URL: `https://<joko-host>/api`  
Example: `https://keit-six.vercel.app/api`

## Auth

```http
Authorization: Bearer {JOKO_API_KEY}
```

Or header `X-Api-Key: {JOKO_API_KEY}`.

| Env (Joko server) | Purpose |
|---|---|
| `JOKO_API_KEY` | Partner bearer secret (default partnerId = `kebu`) |
| `JOKO_DEFAULT_PARTNER_ID` | Optional, default `kebu` |
| `JOKO_API_KEYS` | Multi: `kebu:key1,rect:key2` |
| `JOKO_WEBHOOK_SECRET` | HMAC key for outbound webhooks |
| `PARTNER_WEBHOOK_URL` | Optional default webhook if request omits `webhook_url` |
| `PARTNER_SETTLEMENT_USER_ID` | Optional Joko user wallet credited on collect |
| `PARTNER_MESSAGING_USER_ID` | System user that sends partner Mbolo messages |
| `PUBLIC_APP_URL` | Used to build `payment_url` (fallback: `EXPO_PUBLIC_API_URL`) |
| `JOKO_XOF_PER_USD` | Legacy USD→XOF bridge (default `600`) |
| `PARTNER_SANDBOX_AUTO_COMPLETE` | If `true`, hosted confirm auto-completes in sandbox |

Kebu should set:

```
JOKO_API_BASE_URL=https://<joko-host>/api
JOKO_API_SECRET=<same as JOKO_API_KEY>
JOKO_WEBHOOK_SECRET=<same as JOKO_WEBHOOK_SECRET>
```

## Mode 1 — Accept payment online (shop checkout)

### `POST /v1/checkout/sessions`

Preferred body (XOF):

```json
{
  "reference": "shop_order_<uuid>",
  "amount_xof": 15000,
  "currency": "XOF",
  "description": "Shop order: Product",
  "customer": { "phone": "+22177…", "email": "optional@…" },
  "method": "wave",
  "return_url": "https://kebu…/thanks",
  "cancel_url": "https://kebu…/cancel",
  "webhook_url": "https://kebu…/api/webhooks/joko",
  "metadata": {
    "partner": "kebu",
    "kind": "shop_order",
    "order_id": "…",
    "project_id": "…"
  }
}
```

Legacy bridge: `amount` (USD cents) + `currency: "USD"` converts via `JOKO_XOF_PER_USD` until Kebu sends XOF natively.

Response:

```json
{
  "id": "pay_…",
  "reference": "shop_order_…",
  "status": "pending",
  "payment_url": "https://…/api/v1/pay/pay_…?token=…",
  "amount_xof": 15000,
  "mode": "sandbox"
}
```

`payment_url` always present — hosted Joko pay page. Buyer enters phone; MM is push-to-phone in live mode.

Idempotency: same `partnerId` + `reference` + same `amount_xof` returns existing session.

### `POST /v1/payments/collect`

Same auth. Requires phone. Same response shape (also returns `payment_url`).

### `GET /v1/payments/:reference`

Poll status: `pending` | `requires_action` | `completed` | `failed`.

### `POST /v1/payments/:reference/sandbox-complete`

Sandbox / mock Julaya only. Marks paid and fires webhook. **Blocked in live mode.**

## Webhook (required for Kebu “paid”)

When status becomes completed, Joko POSTs to `webhook_url`:

```json
{
  "reference": "shop_order_…",
  "payment_id": "pay_…",
  "status": "paid",
  "amount_xof": 15000,
  "metadata": { "partner": "kebu", "kind": "shop_order", "order_id": "…" }
}
```

**Signature mode: HMAC-SHA256** (matches Kebu `verifyJokoWebhookSignature`):

```
Header: x-joko-signature: sha256=<hex>
= HMAC_SHA256(raw_body, JOKO_WEBHOOK_SECRET)
```

Retries: up to 5 attempts with backoff on non-2xx.

## Mode messaging — verification + fulfill texts

### `POST /v1/messages/send`

```json
{
  "to_phone": "+22177…",
  "text": "Your code is 482191",
  "channel": "mbolo_auto",
  "metadata": { "partner": "kebu", "kind": "verification" }
}
```

Optional header: `Idempotency-Key`.

Response:

```json
{
  "id": "msg_…",
  "status": "sent",
  "channel_used": "mbolo",
  "error": null
}
```

Rules:

- Joko user with that phone → deliver in Mbolo (`channel_used: mbolo`)
- Else → SMS via configured provider (`channel_used: sms`)
- Else → `status: failed` with honest `error` (never fake sent)

## Sandbox checklist

1. Set `JOKO_API_KEY`, `JOKO_WEBHOOK_SECRET`, `PUBLIC_APP_URL` on Joko  
2. `POST /v1/checkout/sessions` with `amount_xof` + `webhook_url` pointing at Kebu or a request bin  
3. `POST /v1/payments/:reference/sandbox-complete`  
4. Confirm Kebu marks `shop_order` paid (or your bin shows HMAC body)  
5. `GET /v1/payments/:reference` → `completed`  
6. `POST /v1/messages/send` to a test phone  

## Roadmap (later slices)

| Slice | Capability |
|---|---|
| 2 | In-store POS collect / QR terminal |
| 3 | Partner payout / send payment API |
| 4 | Mbolo Business CS agents (hire agents, shop inbox) |

## Do not claim

Do not claim “works with Kebu live” until one real webhook round-trip against Kebu’s `/api/webhooks/joko` succeeds with matching secrets.
