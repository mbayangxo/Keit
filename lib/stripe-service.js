import Stripe from 'stripe';
import { prisma } from './prisma.js';
import { reference } from '../api/_lib/auth.js';
import { completeCashIn } from './rail-service.js';
import { runMoneyTransaction } from './wallet-atomic.js';
import { getAppPublicOrigin } from './k21-qr.js';

let stripeClient = null;

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });
  }
  return stripeClient;
}

export function xofToStripeCents(amountXof) {
  const rate = Number(process.env.STRIPE_XOF_PER_EUR ?? 655.957);
  const eur = amountXof / rate;
  return Math.max(50, Math.round(eur * 100));
}

export function stripeDepositShape(row) {
  return {
    id: row.id,
    reference: row.reference,
    amountXof: row.amountXof,
    amountEurCents: row.amountEurCents,
    status: row.status,
    stripeSessionId: row.stripeSessionId ?? null,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export async function createStripeDepositSession(userId, amountXof) {
  if (!stripeConfigured()) {
    throw new Error('Stripe not configured');
  }
  if (amountXof < 1000) {
    throw new Error('Minimum 1 000 FCFA');
  }
  if (amountXof > 2_000_000) {
    throw new Error('Maximum 2 000 000 FCFA');
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { wallet: true },
  });
  if (!user.wallet) throw new Error('Wallet not found');

  const ref = reference('STR');
  const amountEurCents = xofToStripeCents(amountXof);

  const deposit = await prisma.stripeDeposit.create({
    data: {
      userId,
      amountXof,
      amountEurCents,
      reference: ref,
      status: 'pending',
    },
  });

  const origin = getAppPublicOrigin();
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: amountEurCents,
          product_data: {
            name: `K21 Wallet — ${amountXof.toLocaleString('fr-FR')} FCFA`,
            description: 'Crédit wallet K21 (carte bancaire · diaspora)',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      k21Reference: ref,
      userId,
      amountXof: String(amountXof),
    },
    success_url: `${origin}/?stripe_deposit=success&ref=${encodeURIComponent(ref)}`,
    cancel_url: `${origin}/?stripe_deposit=cancel&ref=${encodeURIComponent(ref)}`,
  });

  await prisma.stripeDeposit.update({
    where: { id: deposit.id },
    data: { stripeSessionId: session.id },
  });

  return {
    ...stripeDepositShape(deposit),
    checkoutUrl: session.url,
    sessionId: session.id,
  };
}

export async function getStripeDepositStatus(reference, userId) {
  const row = await prisma.stripeDeposit.findUnique({ where: { reference } });
  if (!row || row.userId !== userId) return null;
  return stripeDepositShape(row);
}

export function verifyStripeWebhook(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return null;
  return Stripe.webhooks.constructEvent(rawBody, signature, secret);
}

export async function settleStripeDepositFromSession(session) {
  const ref = session.metadata?.k21Reference;
  if (!ref) return { handled: false, reason: 'missing_reference' };

  return runMoneyTransaction(prisma, async (tx) => {
    const deposit = await tx.stripeDeposit.findUnique({ where: { reference: ref } });
    if (!deposit) return { handled: false, reason: 'deposit_not_found' };
    if (deposit.status === 'completed') return { handled: true, duplicate: true, reference: ref };

    const user = await tx.user.findUniqueOrThrow({
      where: { id: deposit.userId },
      include: { wallet: true },
    });
    if (!user.wallet) throw new Error('Wallet not found');

    await completeCashIn(tx, {
      userId: user.id,
      walletId: user.wallet.id,
      country: user.country ?? 'SN',
      amount: deposit.amountXof,
      reference: ref,
      sourceNote: 'Stripe card deposit',
    });

    await tx.stripeDeposit.update({
      where: { id: deposit.id },
      data: {
        status: 'completed',
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
        completedAt: new Date(),
      },
    });

    return { handled: true, reference: ref, amountXof: deposit.amountXof };
  });
}
