/**
 * Trending hub — climate alerts, news, causes for the user's region.
 */

import {
  listRegionalAlerts,
  listTrendingArticles,
  syncAlertNotificationsForUser,
} from './regional-alerts-service.js';

function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Hier' : `Il y a ${days} j`;
}

export async function getTrendingFeed(userId, { tab = 'all', query = '' } = {}) {
  const q = String(query).trim().toLowerCase();

  const [{ region, alerts, preview: alertsPreview }, { articles, preview: articlesPreview }] = await Promise.all([
    listRegionalAlerts(userId),
    listTrendingArticles(userId, {
      category: tab === 'causes' ? 'cause' : tab === 'news' ? 'news' : undefined,
    }),
  ]);

  // Fire-and-forget urgent alert notifications for this user
  syncAlertNotificationsForUser(userId).catch(() => {});

  const filterText = (s) => !q || String(s).toLowerCase().includes(q);

  const shapedAlerts = alerts.map((a) => ({
    ...a,
    kind: 'alert',
    timeLabel: relativeTime(a.publishedAt),
  }));

  const shapedArticles = articles.map((a) => ({
    ...a,
    kind: 'article',
    timeLabel: relativeTime(a.publishedAt),
  }));

  const featuredAlert = shapedAlerts.find((a) => a.featured) ?? shapedAlerts[0] ?? null;

  let items = [];
  if (tab === 'alerts') {
    items = shapedAlerts.filter((a) => filterText(`${a.title} ${a.body} ${a.regionLabel}`));
  } else if (tab === 'news') {
    items = shapedArticles.filter((a) => a.category === 'news' && filterText(`${a.title} ${a.excerpt}`));
  } else if (tab === 'causes') {
    items = shapedArticles.filter((a) => a.category === 'cause' && filterText(`${a.title} ${a.excerpt}`));
  } else {
    items = [
      ...shapedAlerts.map((a) => ({ ...a, priority: a.severity === 'urgent' ? 0 : a.severity === 'watch' ? 1 : 2 })),
      ...shapedArticles.map((a) => ({ ...a, priority: 3 })),
    ]
      .filter((item) => filterText(`${item.title} ${item.body ?? item.excerpt ?? ''}`))
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      });
  }

  return {
    tab,
    region,
    featuredAlert,
    alerts: shapedAlerts,
    articles: shapedArticles,
    items,
    alertCount: shapedAlerts.length,
    preview: Boolean(alertsPreview || articlesPreview),
    message:
      shapedAlerts.length > 0
        ? `${shapedAlerts.length} alerte(s) active(s) pour ${region.regionName ?? 'ta zone'}.`
        : 'Aucune alerte active dans ta zone — tu es informé·e en priorité quand ça change.',
  };
}
