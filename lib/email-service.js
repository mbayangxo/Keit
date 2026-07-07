/**
 * Transactional email — OTP recovery. Mock when no provider key (beta logs to console).
 */

import { fetchExternalJson } from './external-fetch.js';

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function formatOtpEmailHtml(code) {
  return `<p>Ton code K21 est <strong>${code}</strong>.</p><p>Valide 10 minutes. Ne le partage avec personne.</p>`;
}

export async function sendOtpEmail(to, code) {
  const email = String(to ?? '')
    .trim()
    .toLowerCase();
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email');
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || 'K21 <noreply@k21.app>';

  if (!apiKey) {
    console.info('[email:mock] OTP to', email, 'code', code);
    return { provider: 'mock', delivered: false };
  }

  await fetchExternalJson('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Ton code K21',
      html: formatOtpEmailHtml(code),
    }),
  });

  return { provider: 'resend', delivered: true };
}

export async function sendAlertEmail(to, subject, text) {
  const email = String(to ?? '')
    .trim()
    .toLowerCase();
  if (!email || !email.includes('@')) return { provider: 'skip', delivered: false };

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || 'K21 <noreply@k21.app>';

  if (!apiKey) {
    console.info('[email:mock] alert to', email, subject, text);
    return { provider: 'mock', delivered: false };
  }

  await fetchExternalJson('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      html: `<p>${String(text).replace(/\n/g, '<br/>')}</p>`,
    }),
  });

  return { provider: 'resend', delivered: true };
}
