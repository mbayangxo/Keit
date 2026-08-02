# K21 Events — separate app (not in main K21 wallet)

**Decision (Aug 2026):** Event creation, ticket purchase, QR check-in, and “Mes billets” are **removed from the main K21 Expo app**. They belong in a **dedicated K21 Events app** that still runs on the same platform API and ledger.

## Why split

| Main K21 | K21 Events |
|----------|------------|
| Wallet, B2B trade portal, delivery, payroll, Mboolo | Promoters, venues, ticket sales, door scan |
| Business KEBU, wholesale, invoices | Consumer ticket UX, seating, check-in staff |
| “Pay for life” infrastructure | “Go out tonight” product |

Same backend (`/api/events/*`, `/api/tickets/*`) can stay in this repo for now — the Events app will call those routes. The main K21 app **must not** surface ticket UI or deep links to check-in.

## Backend preserved (platform)

| Route | Purpose |
|-------|---------|
| `GET/POST /api/events` | List / create events |
| `POST /api/events/:id/tickets` | Purchase tickets (wallet debit) |
| `GET /api/tickets/mine` | Buyer wallet passes |
| `POST /api/tickets/check-in` | Door scan |
| `GET /api/events/:id/scan-stats` | Promoter stats |

Schema: `Event`, `Ticket` models in `prisma/schema.prisma`.

## Main K21 app — removed surfaces

- `EventCreateScreen`, `MyTicketsScreen`, `EventScannerScreen`
- Discover **Events** tab and ticket purchase
- Marketplace **Billets** tile
- MoreActions **Mes billets / Créer event**
- QR mode `ticket` → toast pointing to Events app (when published)

## K21 Events app — target MVP

1. Browse events · buy ticket (K21 wallet / national)
2. Wallet pass + QR (`k21://ticket/…`)
3. Promoter: create event, price, capacity
4. Staff: scan check-in app
5. Same auth session as K21 where OS allows

## Regulatory

Ticket sales still settle through K21 wallet rules in [`K21-FINANCIAL-SECURITY.md`](K21-FINANCIAL-SECURITY.md). No second ledger.
