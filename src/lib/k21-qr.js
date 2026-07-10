/** Client-side K21 QR deep-link parsing (mirrors lib/k21-qr.js). */

import { Platform } from 'react-native';

export function normalizeHandle(handle) {
  return String(handle ?? '').replace(/^@/, '').trim().toLowerCase();
}

export function getAppPublicOrigin() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  const base = String(process.env.EXPO_PUBLIC_API_URL ?? '').trim();
  if (!base) return '';
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return base.replace(/\/$/, '');
  }
  return `https://${base.replace(/\/$/, '')}`;
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

export function buildWebFriendUrl(handle) {
  const h = normalizeHandle(handle);
  if (!h) throw new Error('Handle required');
  const origin = getAppPublicOrigin();
  return origin ? `${origin}/u/${h}` : `https://k21.app/u/${h}`;
}

export function buildWebPayUrl(handle) {
  const h = normalizeHandle(handle);
  if (!h) throw new Error('Handle required');
  const origin = getAppPublicOrigin();
  return origin ? `${origin}/pay/${h}` : `https://k21.app/pay/${h}`;
}

export function buildMerchantPayUrl(businessId) {
  const id = String(businessId ?? '').trim();
  if (!id) throw new Error('Business id required');
  return `k21://merchant/${id}`;
}

export function buildStudentPassUrl(handle) {
  const h = normalizeHandle(handle);
  if (!h) throw new Error('Handle required');
  return `k21://pass/@${h}`;
}

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
    if (path === 'pass' && rest) return { kind: 'student_pass', handle: rest.toLowerCase() };
    if (path === 'merchant' && rest) return { kind: 'pay_merchant', businessId: rest };
  }

  try {
    const u = new URL(text, getAppPublicOrigin() || 'https://k21.app');
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts[0] === 'pay' && parts[1]) {
      return { kind: 'pay_user', handle: normalizeHandle(parts[1]) };
    }
    if (parts[0] === 'u' && parts[1]) {
      return { kind: 'add_user', handle: normalizeHandle(parts[1]) };
    }
    if (parts[0] === 'invite' && parts[1]) {
      return { kind: 'add_user', handle: normalizeHandle(parts[1]) };
    }
    if (parts[0] === 'merchant' && parts[1]) {
      return { kind: 'pay_merchant', businessId: parts[1] };
    }
    if (parts[0] === 'pass' && parts[1]) {
      return { kind: 'student_pass', handle: normalizeHandle(parts[1]) };
    }
  } catch {
    /* not a URL */
  }

  return null;
}
