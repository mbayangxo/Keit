const OUTBOX_KEY = 'mbolo_outbox_v1';

async function readRaw() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(OUTBOX_KEY);
  }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(OUTBOX_KEY);
}

async function writeRaw(value) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(OUTBOX_KEY, value);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(OUTBOX_KEY, value);
}

async function readOutbox() {
  try {
    const raw = await readRaw();
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeOutbox(items) {
  await writeRaw(JSON.stringify(items));
}

export async function enqueueMboloMessage(threadId, payload) {
  const items = await readOutbox();
  const entry = {
    id: `ob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    threadId,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  items.push(entry);
  await writeOutbox(items);
  return entry;
}

export async function flushMboloOutbox(threadId) {
  const items = await readOutbox();
  const mine = items.filter((e) => e.threadId === threadId);
  const rest = items.filter((e) => e.threadId !== threadId);
  const sent = [];

  const { sendMboloMessage } = await import('./api-client');

  for (const entry of mine) {
    try {
      const msg = await sendMboloMessage(entry.threadId, entry.payload);
      sent.push(msg);
    } catch (err) {
      entry.attempts += 1;
      entry.lastError = err?.message ?? 'send failed';
      rest.push(entry);
    }
  }

  await writeOutbox(rest);
  return sent;
}

export async function outboxCount(threadId) {
  const items = await readOutbox();
  return threadId ? items.filter((e) => e.threadId === threadId).length : items.length;
}
