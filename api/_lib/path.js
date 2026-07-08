/** Resolve /api/foo/bar segments from Vercel req (query catch-all or URL fallback). */
export function apiPathSegments(req) {
  const fromQuery = req.query?.path ?? req.query?.slug;
  if (fromQuery != null) {
    if (Array.isArray(fromQuery)) return fromQuery.filter(Boolean);
    const text = String(fromQuery).trim();
    if (text) return text.split('/').filter(Boolean);
  }

  const raw = String(req.url ?? '');
  const pathname = raw.split('?')[0];
  const match = pathname.match(/\/api\/(.+)/);
  if (match?.[1]) return match[1].split('/').filter(Boolean);

  return [];
}
