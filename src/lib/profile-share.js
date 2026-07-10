import { Linking, Platform, Share } from 'react-native';
import {
  buildUserPayUrl,
  buildUserProfileUrl,
  buildWebFriendUrl,
  buildWebPayUrl,
  normalizeHandle,
} from './k21-qr';
import { whatsAppShareUrl } from './receipt-share';

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

export function buildFriendInviteMessage({ name, handle }) {
  const h = normalizeHandle(handle);
  const displayName = String(name ?? h).trim() || h;
  const web = buildWebFriendUrl(h);
  const deep = buildUserProfileUrl(h);
  const origin = getAppPublicOrigin();
  const download = origin || web;

  return [
    `Rejoins-moi sur K21 🇸🇳`,
    `@${h} · ${displayName}`,
    '',
    'Envoie de l\'argent, Mboolo, split resto — zéro frais.',
    '',
    `Ajoute-moi : ${web}`,
    `Lien app : ${deep}`,
    download ? `Télécharge K21 : ${download}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildPayInviteMessage({ name, handle }) {
  const h = normalizeHandle(handle);
  const displayName = String(name ?? h).trim() || h;
  const web = buildWebPayUrl(h);
  const deep = buildUserPayUrl(h);
  const origin = getAppPublicOrigin();

  return [
    `Envoie-moi de l'argent sur K21 💸`,
    `@${h} · ${displayName}`,
    '',
    `Payer : ${web}`,
    `Lien app : ${deep}`,
    origin ? `K21 : ${origin}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function shareFriendInvite(profile) {
  const message = buildFriendInviteMessage(profile);
  try {
    await Share.share({ message, title: 'Mon K21' });
  } catch {
    /* dismissed */
  }
}

export async function sharePayInvite(profile) {
  const message = buildPayInviteMessage(profile);
  try {
    await Share.share({ message, title: 'Me payer sur K21' });
  } catch {
    /* dismissed */
  }
}

export async function shareViaWhatsApp(text) {
  const url = whatsAppShareUrl(text);
  const can = await Linking.canOpenURL(url);
  if (can) {
    await Linking.openURL(url);
    return;
  }
  await Share.share({ message: text });
}
