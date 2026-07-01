# K21 design source of truth

These files are the canonical reference for converting HTML prototypes into
React Native screens. Match colors, spacing, radii, and animation timings
exactly — see `src/theme/index.js` for the extracted design tokens.

- `design-brief.md` — full product + design brief (locked decisions, §03 is the locked color/type system)
- `k21-remaining-flows.html` — **canonical Home Dashboard** (Flow 01), Send Money, Chart 221 Bëgg, and other flows. Built to the brief's exact §04 app structure and the "always #050805, never white" background rule.
- `k21-complete-redesign.html` — earlier full-app pass (Home, Mboolo chat, Trending, Discover, Eat, Events, Notifications, Profile, Rect Sound). Superseded for Home by k21-remaining-flows.html, but still the reference for screens not present in that file.
- `k21-mboolo-bright.html` — Mboolo-specific warm-white palette (`#fff9f4`) and components; use this (not the dark Mboolo chat in k21-complete-redesign.html) as the canonical Mboolo screens reference.
- `k21-logo-alive.html` — logo mark and animated app-icon reference.

When two files disagree on a screen, prefer the more structurally complete
one that matches the brief's app structure (§04) and locked color rules
(§03) — that was the resolution used for Home Dashboard.
