/** Helpers for Mboolo social + money flows. */

export function getDirectPartner(thread, userId) {
  if (!thread || thread.type !== 'direct') return null;
  const member = (thread.members ?? []).find((m) => m.userId !== userId);
  return member?.user ?? null;
}

export function findDirectThreadForUser(threads, friendUserId) {
  return (threads ?? []).find(
    (t) =>
      t.type === 'direct' &&
      (t.members ?? []).some((m) => m.userId === friendUserId),
  );
}

export function navigateToMboloChat(navigation, { threadId, thread, title }) {
  navigation.navigate('Main', {
    screen: 'MbooloTab',
    params: {
      screen: 'MbooloChat',
      params: { threadId, thread, title },
    },
  });
}

export function formatXof(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0 F';
  return `${Math.round(n).toLocaleString('fr-FR')} F`;
}
