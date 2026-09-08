# K21 Mboolo — chat platform spec

Mboolo is **money-native chat** wired to the K21 wallet. Supabase Storage can be added later; legacy mode works today.

## Wallet ↔ chat (connected)

| Action | Wallet API | Receipt in thread |
|--------|------------|-------------------|
| Send in DM | `POST /api/transfers/send` + `threadId` | Auto — direct thread or explicit thread |
| Accept money request | `POST /api/transfers/requests/:id/accept` | Auto in DM with requester |
| Pay merchant | `POST /api/merchants/:id/pay` + optional `threadId` | Auto when DM exists |
| Request money | `POST /api/transfers/request` | Text card in chat (client) |

All payment cards use `kind: payment` with verifiable `reference` JSON.

## Differentiators (shipped)

1. **Save to Rec** — long-press media → vault or profile (`POST /api/mbolo/messages/:id/save`)
2. **Voice / text money** — `Envoie 2000 à @amadou` in composer
3. **Teranga GIF studio** — attach sheet → Studio (web: video frames → GIF)
4. **Receipt-in-thread** — universal payment cards with reference
5. **Low-data mode** — tap-to-load media thumbnails (`Moi → Accessibilité`)
6. **Tontine threads** — group chat + escrow banner on create

## Architecture

| Layer | Technology |
|-------|------------|
| Messages | Postgres `MboloMessage` |
| Media (when configured) | Supabase Storage `mbolo-media` |
| Rec vault | `UserMediaVault` + `MbooloMediaAsset` |
| Presence | `MboloMember.lastTypingAt` / `lastReadAt` |
| Stories | `UserStory` (24h) |
| E2E (stub) | `UserDeviceKey` register API |
| Offline | `src/lib/mbolo-outbox.js` |

## Build phases

### Phase 1 — Storage E2E ✅ (Supabase env optional)

- Schema, upload API, client `sendMbooloMediaMessage`, GIF library, search, vault UI

### Phase 2 — Realtime & UX ✅ (Postgres presence + poll)

- 3s message poll while chat open
- Typing + read receipts via `/api/mbolo/threads/:id/presence`
- Voice waveform in bubbles
- Offline outbox flush on focus
- LiveKit calls — env when ready (`K21-CALLS-LIVEKIT.md`)

### Phase 3 — Security & social ✅ (foundation)

- Stories API (`GET/POST /api/mbolo/stories`)
- Device key register (`POST /api/mbolo/device-keys`) — E2E encrypt next
- Ephemeral messages (`expiresAt`) + daily cron `mbolo_ephemeral`
- Full E2E encrypt — client crypto next sprint

## Setup

1. `npm run db:setup` on your Postgres (no Supabase Storage required for legacy)
2. Later: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, bucket `mbolo-media`
3. Later: LiveKit env for calls

## API reference

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/mbolo/messages/:id/save` | Save media to Rec vault / profile |
| GET | `/api/mbolo/threads/:id/presence` | Typing + read + commerce context |
| POST | `/api/mbolo/threads/:id/typing` | Typing ping |
| GET/POST | `/api/mbolo/stories` | 24h status |
| POST | `/api/mbolo/device-keys` | Register device key (E2E prep) |
