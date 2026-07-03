/**
 * SMS provider config — Africa's Talking (WAEMU) or Twilio.
 * Keys in environment variables only. Mock mode logs to console when no key.
 */

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function smsConfig() {
  const atKey = process.env.AFRICASTALKING_API_KEY?.trim();
  const atUser = process.env.AFRICASTALKING_USERNAME?.trim();
  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioFrom = process.env.TWILIO_FROM_NUMBER?.trim();

  if (atKey && atUser) {
    return {
      provider: 'africastalking',
      mode: isProduction() ? 'live' : 'sandbox',
      apiKey: atKey,
      username: atUser,
      shortCode: process.env.AFRICASTALKING_SHORT_CODE?.trim() || null,
      webhookSecret: process.env.SMS_WEBHOOK_SECRET?.trim() || null,
    };
  }

  if (twilioSid && twilioToken && twilioFrom) {
    return {
      provider: 'twilio',
      mode: isProduction() ? 'live' : 'sandbox',
      accountSid: twilioSid,
      authToken: twilioToken,
      fromNumber: twilioFrom,
      webhookSecret: process.env.SMS_WEBHOOK_SECRET?.trim() || null,
    };
  }

  return { provider: 'mock', mode: 'mock' };
}

export function smsConfigured() {
  return smsConfig().provider !== 'mock';
}
