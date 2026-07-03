# K21 — Regulatory Strategy & Honest Kori Positioning

**For Cursor, regulators, investors, and product decisions.** Read alongside [`K21-BUILD-SPEC.md`](K21-BUILD-SPEC.md).

---

## BCEAO license — what's actually required

To operate payments legally in Senegal and WAEMU you need **either**:

1. Your own **BCEAO license**, or  
2. Build on a **licensed partner** (Julaya, Pawapay) while your application is in process.

### Application requirements (own license)

| Requirement | Detail |
|-------------|--------|
| Legal entity | SARL registered in Senegal (~150k–300k XOF, 2–4 weeks) |
| Minimum capital | 10M XOF (basic payment institution) · 20M XOF (full payment initiation) — held in Senegalese bank |
| AML/KYC docs | Identity verification + anti–money laundering policies |
| Technical security | How user funds and data are protected |
| Business plan | Payment model and operations |

**Timeline:** 12–18 months for approval.

**Launch strategy:** Go live on **Julaya/Pawapay rails first**; apply for own license in parallel. Transition to own rails when approved and volume justifies it.

### United States (Phase 1)

- Full path: FinCEN MSB + state Money Transmitter Licenses (50 states) — **2–3 years, do not pursue alone yet**
- Phase 1: Partner with licensed US transmitter (**LemFi**, Sendwave, etc.) — K21 provides interface; partner holds US regulatory burden

---

## Closed loop — what you can do now

A **closed-loop** system (money stays inside K21 between users and registered merchants) sits in a **lighter regulatory category** than full payment-institution status in most jurisdictions — **when cash in/out uses licensed rails**.

### Can launch immediately (internal / closed loop)

- K21 ↔ K21 **₭ Kori** transfers  
- Merchant QR payments **within K21 network**  
- Tontine and group splitting **inside K21**  
- Kori earn and spend **inside ecosystem**  

### Requires licensed rails from day one

| Flow | Partner |
|------|---------|
| Cash in (Orange Money, Free Money) | Julaya / Pawapay |
| Cash out to mobile money | Julaya / Pawapay |
| International transfer | LemFi / Sama Money |

Be **transparent** with users: Kori is internal stored value; national currency entry/exit goes through licensed partners.

---

## Kori — honest benefits (what to build vs what to promise)

### Real today (build these)

| Benefit | Why it's true |
|---------|----------------|
| **Near-zero cost internal transfers** | No interchange/Visa/network fees on ₭ moves — server cost only vs mobile-money fees on every XOF hop |
| **Retention / stickiness** | Balance inside ecosystem → reason to return (Amazon Coins, Starbucks Stars pattern) |
| **Merchant incentive** | Instant settlement, low/zero fee vs other rails → merchants prefer K21 |
| **Cross-border ₭ between K21 users** | Same ₭ Senegal → Nigeria with no user-visible conversion |
| **Float on reserve** | XOF backing circulation can earn interest at scale (small at first) |

### Real but distant (north star — not Phase 1 messaging)

- Pan-African monetary vision, Cayor Corp / gold backing, continental currency role — **7–10+ years**, requires massive scale first  
- **Do not tell investors this is near-term**

### What Kori is NOT in Phase 1

- Not cryptocurrency  
- No speculative value · not exchange-tradable · does not appreciate  
- **Today:** closed-loop digital credit — cheaper, stickier transactions inside K21  
- **Tomorrow (with scale + backing):** potentially historically significant — but say that only when true

### Messaging discipline

| Audience | Say |
|----------|-----|
| Regulators | Stored-value instrument; Julaya/Pawapay for fiat rails; BCEAO app in process |
| Investors | Closed-loop credit + retention + unit economics on internal transfers; license path clear |
| Users | ₭ makes sending and paying inside K21 instant and free; cash in/out via trusted partners |

---

## Product priority (founder's recommendation)

1. **Perfect core payments first:** send, receive, pay merchants, cash in, cash out — reliable on Julaya  
2. **Kori layer on top:** dual balance, earn, closed-loop transfers — relatively cheap to build, real value  
3. **Big Kori vision:** long-term north star only — precise about today vs tomorrow  

---

## Maps to backend (`/server`)

| Regulatory bucket | Implementation |
|-------------------|----------------|
| Closed-loop ₭ | `koriBalance`, `KoriTransaction`, `KoriReserve`, `/transfers/send?currency=kori` |
| National ledger | `balance`, `LedgerEntry`, atomic `$transaction` |
| Licensed fiat (not live) | Placeholders: Julaya, Pawapay, LemFi in `.env.example` + `regulatory.ts` |
| No crypto / no exchange | No blockchain, no external ₭ market APIs — ever in this codebase without explicit legal review |

---

*Last updated: July 2026*
