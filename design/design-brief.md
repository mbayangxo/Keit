# K21 — LOCKED DESIGN SYSTEM v2 (Bright Era)
## This file is LAW for every AI and human touching K21's UI.
## It supersedes the dark #050805 shell from v1 entirely. Do not revert.

---

## 00. THE ONE RULE

**Every screen sits on the same bright canvas. No screen is ever dark.**
If you are about to give any screen a dark background, stop — you are
breaking the owner's most-repeated instruction. Dark exists ONLY as small
accent objects (the K21 sun disc, ink text, ink buttons), never as a page.

---

## 01. THE CANVAS (every screen, no exceptions)

Use the shared component: `src/components/ScreenBackground.js`.
- Base: airy warm light, `#f9fdf4 → #edf6e4` gradient (root fallback `#f2f8ec`)
- Three soft blooms: green top-left, gold top-right, terracotta bottom
- Drifting wax-print texture (`WaxPattern`, ink at 3% opacity)

Root style of every screen: `{ flex: 1, backgroundColor: '#f2f8ec' }` +
`<ScreenBackground />` as the first child.

---

## 02. COLORS — EXACTLY THREE + NEUTRALS

| Role | Token | Value |
|---|---|---|
| Green (brand voice) | `colors.green` / `colors.greenDark` | #1af060 / #0fbc48 |
| Gold (warmth, CTAs) | `colors.flagGold` / `colors.goldDark` | #fad836 / #e8920a |
| Orange (community) | `colors.terracotta` family ONLY | #e85c1a (±light/dark) |
| Text neutral | `colors.ink` + rgba(5,8,5,x) alphas | #050805 |
| Surface neutral | white alphas on the canvas | rgba(255,255,255,.6–.75) |

**BANNED:** red accents, blue accents, the second orange #ff6422, any new
hue, dark page backgrounds, pure-black cards. On light surfaces use the
Dark variants (greenDark/goldDark/terracotta) for TEXT legibility; bright
variants are for FILLS.

Color lives in a few BIG calm blocks (cards, buttons, artwork) — never in
rows of differently-tinted small elements (that is the carnival; chips are
uniform white pills).

---

## 03. TYPE

- Display: **Unbounded 900** (`fontFamily.displayBlack`) — headlines,
  numerals, wordmark. Editorial scale: screen titles 27–37px, stacked
  multi-line with staggered indent; money numerals large.
- Body: **Outfit** 400/600/700. Never below 10.5px.
- Headline pattern: 2–3 stacked lines, last line in an accent Dark color
  (the "promise line").

---

## 04. SIGNATURE SHAPES (what makes it OURS, not SaaS)

1. **The cut corner** — pills and cards use full round radius EXCEPT the
   bottom-right corner (radius 9–12). Applies to primary CTAs, avatar
   discs, big cards, search bars.
2. **The circle motif** — sunrise rings, dashed tontine orbit, spending
   ring. Circles = community. Use dashed circles for progress/orbit.
3. **The flag micro-stripe** — green/gold/terracotta hairline (3–4px,
   40–70px wide). On the mark, under CTAs, as dividers.
4. **The K21 sun** — ink disc, green Unbounded wordmark (NO blur/glow on
   the letters — crisp), dashed rotating orbit, breathing halo rings.

---

## 05. ALIVE — MANDATORY MOTION (this kills the SaaS feel)

Every screen ships with at least TWO living elements:
- **Entrance:** content springs/slides up staggered (springs with slight
  overshoot, 350–650ms, native driver).
- **Ambient loop:** something breathes — halo rings scale 1↔1.07 (~4.4s),
  dashed orbits rotate (24s linear), equalizer bars dance, gold elements
  glow-pulse, wax texture drifts.
- **Touch:** every pressable scales (PressScale 0.9–0.97). Primary CTAs
  carry a pulsing glow shadow (GlowButton).
Static screens are rejected. Decorative motion must be transform/opacity
only (useNativeDriver), subtle, and never block input.

---

## 06. COMPONENT LAW

- Primary CTA: `GlowButton` (gradient fill, sheen line, glow pulse, tone
  green/gold/orange) or the gold splash pill with ink arrow badge + stripe.
- Chips/filters: uniform white pills (`rgba(255,255,255,.7)` bg, ink text),
  active = ink pill with green text.
- Cards: white-alpha surface OR one big brand-color gradient block (green /
  gold / terracotta). Ink text on light & gold; white text on green &
  terracotta.
- People: initials in tinted discs cycling the three colors — no photos,
  no rainbow rings, no emoji avatars in new work.
- Tab bar: light blur, ink labels, greenDark active dot.

---

## 07. VOICE

French-first with Wolof product names (Yónnee, Jël, Fey, Mboolo, Ñu Lekk,
Wey yu 221 bëgg, Ataya). FR/WO/EN via the i18n `t()` — new user-facing strings go
in `src/i18n/translations.js`, all three languages.

---

## 08. WHAT K21 NEVER LOOKS LIKE

- A dark neon dashboard (SaaS) — banned.
- Sendwave/Wave/generic fintech templates — patterns may be studied,
  pixels may not be copied.
- A carnival — 3 colors, big blocks, calm chips.
- Stock photography of people — typography, color and our motifs instead.

## 09. CHANGE CONTROL

Cursor + Claude: do not redesign the splash, canvas, palette, or these
signatures without the owner's explicit new instruction in writing. If a
prototype HTML file conflicts with this brief, THIS BRIEF WINS.
