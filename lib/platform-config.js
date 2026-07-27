import { callsConfigured } from './calls-service.js';
import { stripeConfigured } from './stripe-service.js';

/**
 * K21 platform capability flags — consumed by the K21 app and future apps (Rect, partners).
 * Single source of truth for what is live vs coming soon. No mock “enabled” flags.
 */
export function getPlatformConfig() {
  const allowBetaDeposits = process.env.ALLOW_BETA_DEPOSITS === 'true';
  const production = process.env.NODE_ENV === 'production';
  const julayaKey = process.env.JULAYA_API_KEY ?? process.env.JULAYA_API_KEY_SANDBOX ?? '';
  const julayaLive =
    Boolean(julayaKey) && !julayaKey.toLowerCase().includes('sandbox') && !julayaKey.startsWith('test_');
  const agentsLive = process.env.AGENT_DEPOSITS_ENABLED !== 'false';
  const stripeLive = stripeConfigured();

  return {
    platform: 'k21',
    version: 1,
    region: 'SN',
    message:
      'K21 est l’app wallet + marketplace + Mboolo au Sénégal. Rect est une app séparée (culture) — elle utilise l’API K21 pour les paiements, sans ledger propre.',
    apps: {
      k21: {
        id: 'k21',
        name: 'K21',
        install: 'this',
        scope: ['wallet', 'marketplace', 'mboolo'],
      },
      rect: {
        id: 'rect',
        name: 'Rect',
        separateApp: true,
        install: 'separate',
        scope: ['culture', 'identity', 'creators'],
        paymentsVia: 'k21-api',
      },
    },
    auth: {
      emailOnly: true,
      phoneRequired: false,
    },
    features: {
      wallet: {
        send: true,
        receive: true,
        requests: true,
        undo: true,
        tontine: true,
      },
      cash: {
        /** Real Mobile Money rails — not beta test credit */
        depositsLive: julayaLive,
        withdrawalsLive: julayaLive,
        /** Admin ALLOW_BETA_DEPOSITS test credits */
        betaDeposits: allowBetaDeposits,
        /** Show Cash screens (beta, agents, stripe, or live MM) */
        available: allowBetaDeposits || agentsLive || stripeLive || !production || julayaLive,
        /** Path B — in-person K21 agents (float-backed) */
        agentDeposits: agentsLive,
        /** Path A — Stripe card (diaspora) */
        stripeDeposits: stripeLive,
      },
      marketplace: {
        delivery: true,
        movement: true,
        seller: true,
        events: true,
        tickets: true,
        merchantPay: true,
      },
      mboolo: {
        chat: true,
        voiceNotes: true,
        voiceCalls: callsConfigured(),
        videoCalls: callsConfigured(),
      },
      comingSoon: {
        nuLekk: true,
        familyWallet: true,
        merchantQrOffline: true,
        float: true,
        wakhna: true,
        lemFiLive: Boolean(process.env.LEMFI_API_KEY && !process.env.LEMFI_API_KEY.includes('sandbox')),
      },
    },
  };
}
