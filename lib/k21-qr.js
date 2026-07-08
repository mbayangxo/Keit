/** Deep-link payloads for scan-to-pay and scan-to-add-friend. */

export function normalizeHandle(handle) {
  return String(handle ?? '').replace(/^@/, '').trim().toLowerCase();
}

export function buildUserPayUrl(handle) {
  const h = normalizeHandle(handle);
  if (!h) throw new Error('Handle required');
  return `k21://pay/@${h}`;
}

export function buildUserProfileUrl(handle) {
  const h = normalizeHandle(handle);
  if (!h) throw new Error('Handle required');
  return `k21://u/@${h}`;
}

export function buildMerchantPayUrl(businessId) {
  const id = String(businessId ?? '').trim();
  if (!id) throw new Error('Business id required');
  return `k21://merchant/${id}`;
}

/**
 * @returns {{ kind: 'pay_user'|'add_user'|'pay_merchant', handle?: string, businessId?: string } | null}
 */
export function parseK21Qr(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return null;

  const handleOnly = text.match(/^@?([a-z0-9_]{3,30})$/i);
  if (handleOnly) {
    return { kind: 'pay_user', handle: handleOnly[1].toLowerCase() };
  }

  const urlMatch = text.match(/^k21:\/\/([^/?#]+)\/?(.*)$/i);
  if (urlMatch) {
    const path = urlMatch[1].toLowerCase();
    const rest = (urlMatch[2] ?? '').replace(/^@/, '').trim();
    if (path === 'pay' && rest) return { kind: 'pay_user', handle: rest.toLowerCase() };
    if ((path === 'u' || path === 'user') && rest) return { kind: 'add_user', handle: rest.toLowerCase() };
    if (path === 'merchant' && rest) return { kind: 'pay_merchant', businessId: rest };
  }

  try {
    const u = new URL(text);
    const host = u.hostname.toLowerCase();
    if (host.includes('k21') || host.includes('vercel') || host.includes('localhost')) {
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts[0] === 'pay' && parts[1]) {
        return { kind: 'pay_user', handle: normalizeHandle(parts[1]) };
      }
      if (parts[0] === 'u' && parts[1]) {
        return { kind: 'add_user', handle: normalizeHandle(parts[1]) };
      }
      if (parts[0] === 'merchant' && parts[1]) {
        return { kind: 'pay_merchant', businessId: parts[1] };
      }
    }
  } catch {
    /* not a URL */
  }

  return null;
}
