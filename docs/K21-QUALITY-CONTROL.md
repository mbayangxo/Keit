# K21 — Quality control before users feel pain

Three layers: **Sentry** (errors), **UptimeRobot** (uptime), **Admin morning check** (money anomalies).

---

## 1. Error logging — Sentry

Sentry captures crashes and unhandled errors on user devices and in the API. Free tier (5k events/month) is enough to start.

### One-time setup

1. Create a project at [sentry.io](https://sentry.io) (React Native + Node if you want API errors in the same org).
2. Copy the **DSN** from Project Settings → Client Keys.
3. Create an **Organization Auth Token** (Developer Settings → Auth Tokens) for source map uploads on EAS Build.

### Environment variables

```bash
# Mobile app (Expo)
EXPO_PUBLIC_SENTRY_DSN=https://…@o….ingest.sentry.io/…
# Optional: send events from local dev
EXPO_PUBLIC_SENTRY_ENABLED=true

# API (Vercel production)
SENTRY_DSN=https://…@o….ingest.sentry.io/…

# EAS Build — upload source maps (secret visibility in EAS)
SENTRY_AUTH_TOKEN=sntrys_…
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=k21-mobile
```

Set `SENTRY_ORG` and `SENTRY_PROJECT` in EAS to match `app.json` plugin config.

### Verify

1. Deploy with DSN set.
2. Trigger a test error in a staging build (or set `EXPO_PUBLIC_SENTRY_ENABLED=true` in dev).
3. Confirm the event appears in Sentry with **screen name**, **device**, and **release**.

### What gets filtered

PINs, tokens, OTP, and CNI never leave the device — `beforeSend` scrubs sensitive keys.

### Wizard (optional)

To auto-configure org/project in `app.json`:

```bash
npx @sentry/wizard@latest -i reactNative
```

Code is already wired; the wizard mainly fills DSN and plugin metadata.

---

## 2. Uptime monitoring — UptimeRobot

Free tier pings your API every **5 minutes** and can SMS you when it goes down.

### Monitor URL

```
GET https://YOUR-APP.vercel.app/api/health
```

Expected response **200**:

```json
{
  "status": "ok",
  "service": "keit-api",
  "db": "ok",
  "uptimeSeconds": 12345,
  "checkedAt": "2026-07-03T12:00:00.000Z"
}
```

If Postgres is unreachable, the endpoint returns **503** with `"status": "degraded"` so UptimeRobot alerts you.

### UptimeRobot setup (~10 minutes)

1. Sign up at [uptimerobot.com](https://uptimerobot.com).
2. **Add New Monitor** → type **HTTP(s)**.
3. URL: `https://YOUR-APP.vercel.app/api/health`
4. Monitoring interval: **5 minutes** (free).
5. Alert contacts: add your phone for **SMS** (and email as backup).
6. Save. You should see “Up” within one interval.

Optional second monitor: `GET /api/health?deep=1` — same checks plus pending-rail count (still 200 if API is up; use for ops dashboards, not downtime).

---

## 3. Transaction monitoring — morning admin check

Use **`/admin`** every morning (~10 minutes). This catches most money issues before users report them.

### Checklist

| Signal | Where | Action if abnormal |
|--------|--------|-------------------|
| Kori reserve mismatch | Dashboard stats — reserve not OK | Run `/api/cron/financial-integrity` or investigate ledger |
| Failed transactions spike | Failed today panel | Open details; check Julaya/partner status |
| Pending rails > 15 min | Pending tab | Poll or release via admin |
| Fraud alerts | Fraud panel | Approve/reject held tx; freeze if needed |
| Held reviews aging | Held panel | Clear backlog |
| Open support tickets | Support tab | Reply / resolve |
| Signups vs failures | Stats row | Correlation or onboarding bug |

The dashboard includes a **`morningCheck`** object: `healthy: false` plus human-readable `alerts[]` when anything needs attention.

### When Sentry fires during the day

1. Open Sentry → note screen, release, device count.
2. Fix and ship; confirm error rate drops in Sentry.
3. If money-related, cross-check `/admin` for failed rails or reserve drift.

---

## Launch gate (reminder)

Before real money: `npm run test:launch-gate` plus this QC stack live (Sentry DSN, UptimeRobot monitor, admin 2FA enabled).
