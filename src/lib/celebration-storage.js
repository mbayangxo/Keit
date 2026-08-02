// Tracks the last incoming transaction we've already celebrated with
// confetti, so a repeat visit to the wallet doesn't replay it. Device-local,
// non-sensitive — plain localStorage on web, SecureStore on native.
const KEY = 'k21_last_celebrated_receive';

export async function getLastCelebratedReceiveId() {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }
  try {
    const SecureStore = await import('expo-secure-store');
    return (await SecureStore.getItemAsync(KEY)) ?? null;
  } catch {
    return null;
  }
}

export async function setLastCelebratedReceiveId(id) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(KEY, id);
  } catch {
    /* ignore */
  }
}
