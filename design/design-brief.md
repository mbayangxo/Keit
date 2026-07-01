# K21 — Complete Product & Design Brief
## Everything confirmed. Nothing speculative.

---

## 01. WHAT K21 IS

K21 is the financial and cultural nervous system of Senegalese youth. It is not a fintech app with culture sprinkled on top. Culture came first. Finance lives inside it. The product makes people laugh, sends money, discovers music, organizes the neighborhood, recognizes artists, and makes daily life easier — all in one place.

**North Star:** "K21 changed my life / made it easier."
Life-changing = zero-fee transfers, no exchange rate theft on diaspora remittances, artists paid directly, recognition for creators that didn't exist before.

**What K21 is NOT:**
- It is not Wave with better marketing
- It is not a commercial product performing community
- It is not a fintech app that looks like one
- It is not built for adults — it is built for youth, by people who understand youth

---

## 02. THE LOGO — LOCKED

**Mark:** Stacked K over gradient divider line over 21.
- K = #1af060 (green)
- Divider = gradient left-to-right: green → gold → orange
- 2 = #f7b731 (gold)
- 1 = #ff6422 (orange)
- The K has a distinctive notch cut — custom, not a standard font character

**Background:** NOT dark flat black. The background feels like Dakar alive — warm terracotta, burnt orange heat, wax print diamond patterns, fabric texture, market energy. The K21 mark sits on top of something that already feels like the city.

**Usage:**
- App icon: dark gradient square container (#0d1f0a → #060c04), K21 mark inside
- On light: deeper color values (#0e8a36 green, #c48a00 gold, #cc4a10 orange)
- Horizontal lockup: mark + divider + "K21 / African Youth Wallet"

---

## 03. DESIGN SYSTEM — LOCKED FOREVER

**Colors:**
- --ink: #050805 (near-black, app background)
- --G: #1af060 (K21 green — primary accent)
- --Y: #f7b731 (gold — secondary)
- --O: #ff6422 (orange — tertiary)
- --R: #e0364a (Rect red — only for Rect products)

**Typography:**
- Display/Headers: Unbounded (weight 700, 900)
- Body/UI: Outfit (weight 400, 500, 600, 700)

**Design energy — NOT regular fintech:**
- Cards breathe slightly — subtle animation
- Chart positions animate when they change
- Money arriving counts up visually in front of you
- Viral content view counts visibly climb
- Every meaningful moment has haptic feedback
- Duolingo-style vibrations and shaking — alive in your hand
- Celebration animation on sends, milestones, certifications
- App feels warm, alive, responsive — not cold and functional

**NO:** White backgrounds. Light screens. Static dead cards. Generic fintech layouts. Purple gradients. Inter or Roboto fonts. Anything that looks like a bank.

---

## 04. APP STRUCTURE

```
K21
├── HOME
│   ├── Greeting in Wolof ("Fondé ak jàmm, [name]")
│   ├── Balance card — Yónnee / Jël / Fey quick actions
│   ├── Rect Sound mini card — Chart #1 right now
│   ├── Mboolo pulse — what's alive in your conversations
│   ├── Recent transactions (social — shows who sent/received)
│   └── Wakhna score strip
│
├── MBOOLO (messaging + community)
│   ├── Conversation list
│   │   ├── Per-conversation status rings (not global stories)
│   │   ├── Status icons show type (🎵 song / 📍 location / 💬 text)
│   │   └── Green ring = fresh status, tap to view
│   ├── Inside each group: stories bar PINNED ABOVE convos
│   │   ├── All group members can post status
│   │   ├── All group members can watch all statuses
│   │   ├── Dafa neex on statuses
│   │   └── Stories archived to Group Memory (1 year history)
│   ├── Song sharing — living cards, not dead files
│   ├── Voice notes — frictionless, one tap
│   ├── Shared buying — "Ñu lekk" pool money for food/things
│   ├── Group gifting — collective contribution with goal
│   ├── Mboolo streaks — daily activity builds Wakhna
│   ├── Snapshot streak — daily photo exchange with contact
│   └── Ataya Rooms (voice rooms — see section 07)
│
├── RECT SOUND (full embedded music platform)
│   ├── LISTENER MODE (default)
│   │   ├── Dégloul Li (playlists — "listen to this")
│   │   ├── Pour Toi (personal feed)
│   │   ├── Chart system (see section 08)
│   │   └── Défis Musique
│   └── ARTIST OS (toggle — artists only)
│       ├── Dashboard + upload
│       ├── Fan messaging (top 100)
│       ├── Revenue + splits
│       ├── Publishing / BSDA
│       └── Rect Distribution
│
├── DISCOVER
│   ├── Culture (sports + events inside)
│   ├── EAT (reviews + merchant profiles + shared buying)
│   ├── Gigs/Hustle
│   ├── Défis (culture/food/sport/style — NOT music)
│   └── Events (with customizable promoter pages)
│
└── MOI
    ├── Profile + Creator status
    ├── Wakhna score + badges
    ├── Wallet settings
    ├── Xel ak Sago (self-budgeting tool)
    └── K21 Pass / Student discount
```

---

## 05. MONEY FEATURES

**Send (Yónnee):**
- Select contact by name, @handle, or number
- SAFETY SCREEN before anything moves:
  - Large photo of recipient
  - Full verified name
  - Full phone number
  - Arrondissement
  - Amount and reason
  - Confirm button: "Oui c'est bien [name] — Envoyer"
  - Cancel button: "Ce n'est pas la bonne personne"
- Zero fees on all domestic transfers

**Receive (Jël):**
- Request money with context ("pour le taxi")
- Context removes social awkwardness
- One-tap payment for the person receiving the request

**Pay (Fey):**
- QR code at merchants — large printed stand, not just sticker
- NFC tap-to-pay (Phase 2)
- Big merchants (KFC, Auchan): integrated into their POS system
- Offline payment token:
  - Balance verified BEFORE token generates
  - Funds soft-reserved — cannot be double-spent
  - Cryptographically unique token
  - Auto-settles on reconnect
  - Merchant hears distinct K21 payment sound + large-text notification

**Tontine Digitale:**
- Group agrees on amount + schedule
- K21 collects automatically on agreed day
- Releases pot to whoever's turn it is
- Transparent, automatic, trusted

**Shared Buying — "Ñu lekk" (let's eat together):**
- From Mboolo group: "on mange ensemble?"
- Set amount per person
- Members contribute with one tap
- Money pools to the buyer's balance instantly
- No awkwardness about who paid what

**Xel ak Sago (self-budgeting):**
- Self-imposed spending limits per category
- Set by user, removed by user only
- Never imposed by another person (not a control feature)
- Framed as personal discipline tool, not restriction

**Account security:**
- Tied to CNI (national ID) not just SIM card
- Lost phone = go to K21 agent with CNI, 5 min biometric, new number attached
- Money never disappears because it's tied to identity not SIM
- Email as secondary recovery for profile (not sufficient alone for wallet)
- Two-factor for large transfers

---

## 06. RECOGNITION SYSTEM — THE CERTIFICATION TIERS

Senegal has no music recognition infrastructure. K21 builds it from scratch.

**Certification names (African, not RIAA):**
- Tier 1: Cauris (cowrie shell — historically currency, universally African)
- Tier 2: Double Cauris
- Tier 3: Baobab (the tree that stands for centuries)
- Tier 4: Légende

**What feeds the certification score:**
- Dafa neex reactions (weighted most heavily — active love)
- Play count
- Times added to Dégloul Li playlists
- Times shared in Mboolo conversations
- Times used in Défis
- Times played in Ataya rooms
- Arrondissement spread (how many distinct areas)

**When a song is certified:**
- Artist receives a beautiful digital certificate
- Every fan who Dafa neex'd it gets: "Tu as contribué à faire cette chanson [Cauris]"
- Shareable card generated automatically
- Featured on Chart home screen with certification badge

**Monthly Artist Spotlight:**
- Auto-generated card: "[Artist] — [Month] — [X] Dafa neex · [X] arrondissements · [Certification]"
- Artist gets it first, shares it, fans share it
- K21 gets organic reach

---

## 07. ATAYA ROOMS

Voice rooms named after the Senegalese tea ceremony — slow, communal, real conversation.

**Anyone can start a room.** No minimum followers. No application. One tap.

**Features:**
- Voice changing available (anonymous performance — fun + political safety)
- Anonymity permitted — important for political speech
- Reported by users if offensive — community moderation not pre-moderation
- Gift sending (TikTok Live model) — public, social, visible to room
- K21 commission: 10-15%, host gets 85-90%
- Trending Ataya rooms feed — ranked by live listeners, gift velocity, growth rate
- TV personalities and TikTok creators can gift money to callers live
- YouTube creators can host their shows — better economics than YouTube draws them organically

**Ataya Trending:**
- Live rooms visible on a trending feed
- Ranked by: listeners, gifts received last hour, fastest growing
- Creates urgency — "this is happening now, don't miss it"

**No gambling or money games** — trivia with prizes is separate and skill-based.

---

## 08. CHART SYSTEM — "221 BËGG" (WHAT SENEGAL LOVES)

**Name options to decide:** 221 Bëgg / Bëgg Chart / Xamal / Waxtu
**Principle:** First credible music chart Senegal has ever had. Explained clearly on the page. Transparent methodology. No paid placement ever.

**Chart explanation (in-app, always visible):**
"221 Bëgg est le premier classement musical basé sur ce que le Sénégal écoute vraiment — pas les streams achetés, pas les playlists payées. Juste les réactions réelles de vraies personnes."

**Chart layers:**
1. **Local** — each arrondissement has its own chart
2. **Bubbling Under** — songs gaining momentum fast, not yet national
3. **National 221** — all of Senegal, all genres
4. **Genre charts** — Mbalax / Afrobeats / Hip-hop / Acoustic / etc.

**All Senegalese artists, not just KDirection.** The chart is credible only if it's open.

**Reaction system:**
- 🔥 Dafa neex — public, feeds chart (most weighted)
- 👍 Like — private, feeds Pour Toi algorithm
- 👎 Dislike — private, artist sees skip/completion rate not raw count
- ✂️ Moment préféré — free clip, artist sees heatmap

**Play count + Dégloul Li usage + Mboolo shares + Ataya plays all feed chart weight.**

**Artist uploads:** Yes, through Artist OS. Every play counts toward chart.

---

## 09. EVENTS

**For fans:**
- Ticket buying through K21
- Who you're buying to see — one tap at checkout (feeds fanbase data)
- Geo-tagged event box — not a feed, a contained grid
  - Photos and videos posted by attendees
  - Only visible to ticket holders for that event
  - Stays permanently as a memory
  - Best boxes recognized as cultural artifacts
- Waitlist system — ticket released back to next fan at original price, no scalpers
- Shareable event cards — beautiful, designed for screenshot
  - Works on WhatsApp, Instagram, TikTok, Snapchat
  - "Fatou y sera 🔥" social proof
  - Web preview for non-K21 users with download prompt

**For promoters and artists:**
- Customizable event pages (paid tier)
  - Custom color scheme
  - Video/audio header
  - Live countdown
  - "Who's going" from your Mboolo contacts
  - Artist direct message to fans
  - Real remaining ticket count
- Data: which arrondissements fans are buying from
- Fanbase data fed by ticket purchases + event box activity + "who are you seeing" data

---

## 10. CREATOR SPOTLIGHT — PUBLIC RECOGNITION

**Monthly:**
- #1 viral content creator (arrondissement reach)
- #1 Défi winner
- Most laughs/reactions
- Most Mboolo shares generated

**Display:**
- Featured on home screen
- Shareable card with stats
- Profile badge for the month

**Arrondissement Leaderboard (monthly):**
- Most viral content produced
- Most new artists discovered
- Most Dafa neex activity
- Most Mboolo streak activity
- Winning arrondissement featured on home screen

---

## 11. WAKHNA SCORE

Reputation system — not followers, real cultural contribution.

**Feeds from:**
- Mboolo streaks (daily activity with contacts)
- Snapshot streaks (daily photo exchange)
- Dafa neex reactions given
- Défis participated in and won
- Dégloul Li playlists created and followed
- Ataya rooms hosted and attended
- Event attendance (verified via ticket)
- Stickers sent to artists

**Public elements:** quartier, category, Wakhna score, certifications contributed to
**Private elements:** exact revenue, direct messages, full transaction history

---

## 12. COMMUNITY FEATURES

**Défis (Challenges):**
- Music, food, sport, style, culture — NOT gambling
- Skill and creativity based only
- Prize money from Défi creation fees
- Group Défis — whole Mboolo enters together, prize splits automatically

**Tontine Digitale:** (see money section)

**Ñu dem (let's go together):**
- Create in Mboolo group
- Members confirm attendance
- Split costs directly through K21
- No separate money conversation needed

---

## 13. GROWTH STRATEGY — 1M DOWNLOADS YEAR 1

**Pre-launch (100 days before):**
- 500 culturally influential people in Médina + Plateau given early access
- Not celebrities — the people everyone in the neighborhood actually trusts
- WhatsApp group where they see behind the scenes and feel ownership
- First 10 KDirection artists signed before launch day

**Launch week:**
- Défi with 1M CFA prize — real money, sent through K21, publicly
- Arrondissement competition from day one of signup
- App launch = cultural event not product launch

**Month 1-3:**
- Campus Ambassador program at UCAD and key lycées
- Tontine Digitale pilot at 3 universities
- 1,000 QR merchant signups in Médina/Plateau ground operation

**Month 2-4:**
- Merchant network creates daily habit (thiébou dieune paid through K21)

**Month 3-6:**
- Diaspora multiplier — 50 community leaders in Paris, Marseille, New York, DC

**Month 4-8:**
- Arrondissement wars — monthly leaderboard becomes cultural event

**Month 6-12:**
- First Cauris/Baobab certifications — proof the culture has a record now
- Monthly creator spotlight spreads organically

**Month 12:**
- 1M download concert — free, in Dakar, funded by brands who want access to K21 audience

---

## 14. LAUNCH SEQUENCE — GEOGRAPHY

1. Médina + Plateau (Dakar) — first users, KDirection fanbase
2. All of Dakar arrondissements
3. All of Senegal
4. Diaspora France
5. Diaspora elsewhere
6. Other African markets

---

## 15. RECT SOUND — PHASE 1 (EMBEDDED IN K21)

Music creates 20x/day opens vs 3x/week for wallet-only. Rect Sound stays fully embedded.

**Why it will work despite low streaming culture:**
- Chart 221 Bëgg doesn't exist anywhere — genuinely new
- Direct economic relationship with artists — not on Spotify/Boomplay
- Recognition system for artists — completely absent in Senegal
- Artists will be interested because they get no support elsewhere

**Artist economics:**
- Artist Pass: ~2,000F/month
  - Full analytics, moment heatmap, fan messaging (top 100)
  - Credits/splits, publishing/BSDA, Rect Distribution
  - 92% sticker revenue
- Listener Pass: ~500F/month
  - Dégloul Li Pro, Dafa neex counts 2x for chart
  - Early chart access 24h, badge
- Student: 250F/month OR earn free month with 30 Dafa neex

---

## 16. RECT — THE PARENT COMPANY (PHASE 2+)

- Rect Sound — music (embedded in K21 Phase 1)
- Rect Screen — licensed + original African shows/films (Phase 2)
- Rect Live — artist performance streaming, gifts in real time (Phase 2)
- Rect Radio — live immersive radio (Phase 2)
- Rect Podcast — long-form with sticker timestamps (Phase 2)
- Rectangl — short-form cultural video, TikTok replacement (Phase 2)
- KDirection — independent record label, first artists on Rect Sound

**Rect Screen is NOT in Phase 1.** No live features. Only licensed/original content on demand. Rect Live is separate from Rect Screen.

---

## 17. INFRASTRUCTURE

**Offline-first:**
- Queue payments offline, execute on reconnect
- Cache Chart songs on WiFi
- Offline payment token (balance verified before generation, funds reserved)

**USSD fallback:** *XXX# — payments without smartphone

**Multi-currency from day one:** CFA, GHS, NGN, KES

**Multi-language:** Wolof, French, English, Hausa, Swahili

**Account security:** CNI-linked, not SIM-linked

**Paris + New York licensing:** In progress — full bilateral transfer is Phase 2

---

## 18. WHAT K21 IS NOT BUILDING YET

- Rect Screen (Phase 2)
- Rect Live (Phase 2)
- Full Rect apps (Phase 2)
- Open video feed (moderation risk at small scale)
- Analytics dashboards for creators (Phase 2)
- Creator fund (organic growth first, fund later)
- NFC tap-to-pay (Phase 2)
- Full international transfers (licensing required)
- Money games or gambling (never)

---

## 19. CULTURE ENCODED IN THE PRODUCT

- **Teranga** — collective support is economic behavior. Tontine, shared buying, group gifting.
- **Griot architecture** — Wakhna is reputation earned through cultural contribution, not followers
- **Oral tradition** — Mboolo is digital mouth-to-ear. Voice notes frictionless.
- **Group over individual** — songs blow up because a group claims them
- **Religious/social calendar** — Ramadan, Korité, Magal, Gamou change content priority
- **Diaspora** — identity maintenance, not just remittances. Sticker to artist = "I still belong"
- **Sports is culture** — lives inside Culture tab, not separate
- **Recognition gap** — Senegal has no infrastructure to say "this mattered." K21 builds it.

---

*Last updated: March 2026 — all items in this document are confirmed product decisions.*
