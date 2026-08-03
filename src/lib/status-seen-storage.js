// Tracks which community-status "stories" the viewer has already opened, so
// the ring shows muted (seen) vs tricolor (unseen) — same idea as WhatsApp
// Status. Keyed by businessId:userId:updatedAt so a fresh post (new
// updatedAt) shows as unseen again. Device-local, non-sensitive —
// localStorage on web, SecureStore on native.
const KEY = 'k21_seen_statuses';
const MAX_ENTRIES = 300;

async function readSeen() {
  let raw = null;
  if (typeof localStorage !== 'undefined') {
    try {
      raw = localStorage.getItem(KEY);
    } catch {
      raw = null;
    }
  } else {
    try {
      const SecureStore = await import('expo-secure-store');
      raw = await SecureStore.getItemAsync(KEY);
    } catch {
      raw = null;
    }
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSeen(list) {
  const raw = JSON.stringify(list.slice(-MAX_ENTRIES));
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(KEY, raw);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(KEY, raw);
  } catch {
    /* ignore */
  }
}

export async function getSeenStatusKeys() {
  return readSeen();
}

export async function markStatusSeen(key) {
  const list = await readSeen();
  if (list.includes(key)) return list;
  const next = [...list, key];
  await writeSeen(next);
  return next;
}
