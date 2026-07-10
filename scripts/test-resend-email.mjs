/**
 * One-time check: sends a test K21 OTP email via Resend.
 * Usage (replace with your values):
 *   RESEND_API_KEY=re_xxxx RESEND_FROM="K21 <onboarding@resend.dev>" node scripts/test-resend-email.mjs you@gmail.com
 */
import { sendOtpEmail, emailConfigured } from '../lib/email-service.js';

const to = process.argv[2]?.trim();
if (!to || !to.includes('@')) {
  console.error('Usage: RESEND_API_KEY=re_... RESEND_FROM="K21 <onboarding@resend.dev>" node scripts/test-resend-email.mjs your@email.com');
  process.exit(1);
}

if (!emailConfigured()) {
  console.error('Missing RESEND_API_KEY — copy it from resend.com → API Keys');
  process.exit(1);
}

const code = String(Math.floor(100000 + Math.random() * 900000));
try {
  const result = await sendOtpEmail(to, code);
  console.log('OK — test email sent to', to);
  console.log('Provider:', result.provider, '| Code (for check):', code);
} catch (err) {
  console.error('Failed:', err.message ?? err);
  process.exit(1);
}
