/**
 * Eventbrite ingestion for the Discover/culture feed.
 *
 * HONEST LIMITATION: Eventbrite shut down its public event *search* API in
 * 2020 — there is no "all events in Dakar" endpoint anymore. The v3 API only
 * returns events belonging to organizations the token can access. So this
 * pulls live events from the orgs on YOUR Eventbrite account (or explicit
 * org IDs), which fits the K21 model: partner organizers connect their
 * Eventbrite and their events appear in Discover.
 *
 * Config (Vercel env vars):
 *   EVENTBRITE_TOKEN    — private token from eventbrite.com/platform/api-keys
 *   EVENTBRITE_ORG_IDS  — optional comma-separated org IDs; defaults to all
 *                         orgs on the token.
 */

const EB_BASE = 'https://www.eventbriteapi.com/v3';
const CACHE_TTL_MS = 10 * 60 * 1000;

let cache = { at: 0, events: [] };

async function ebFetch(path, token) {
  const res = await fetch(`${EB_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Eventbrite ${res.status} on ${path}`);
  return res.json();
}

async function resolveOrgIds(token) {
  const configured = process.env.EVENTBRITE_ORG_IDS?.trim();
  if (configured) return configured.split(',').map((s) => s.trim()).filter(Boolean);
  const data = await ebFetch('/users/me/organizations/', token);
  return (data.organizations ?? []).map((o) => o.id);
}

function mapEvent(ev) {
  const start = ev.start?.local ? new Date(ev.start.local) : null;
  return {
    key: `eb-${ev.id}`,
    icon: '🎫',
    title: ev.name?.text ?? 'Événement',
    meta: [
      ev.venue?.address?.city ?? ev.online_event ? 'En ligne' : 'Dakar',
      start
        ? start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) +
          ' · ' +
          start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : null,
    ]
      .filter(Boolean)
      .join(' · '),
    tag: 'Event',
    region: 'eventbrite',
    url: ev.url,
    source: 'eventbrite',
  };
}

/** Live events from configured Eventbrite orgs; [] when unconfigured or failing. */
export async function getEventbriteEvents() {
  const token = process.env.EVENTBRITE_TOKEN?.trim();
  if (!token) return [];

  if (Date.now() - cache.at < CACHE_TTL_MS) return cache.events;

  try {
    const orgIds = await resolveOrgIds(token);
    const batches = await Promise.all(
      orgIds.slice(0, 5).map((id) =>
        ebFetch(`/organizations/${id}/events/?status=live&order_by=start_asc&expand=venue`, token)
          .then((d) => d.events ?? [])
          .catch(() => []),
      ),
    );
    const events = batches.flat().slice(0, 12).map(mapEvent);
    cache = { at: Date.now(), events };
    return events;
  } catch (error) {
    console.error('[eventbrite] fetch failed', error);
    return cache.events; // stale cache beats an empty feed
  }
}
