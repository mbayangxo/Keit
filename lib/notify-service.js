/**
 * User notifications — in-app + optional SMS for offline / feature-phone users.
 * SMS is sent AFTER money commits; SMS failure never rolls back a transaction.
 */

import { prisma } from './prisma.js';
import { formatKori } from './kori.js';
import {
  formatBalanceMessage,
  formatDepositMessage,
  formatReceivedMessage,
  sendSms,
} from './sms-service.js';

/** Create in-app notification. */
export async function createInAppNotification(userId, title, body) {
  return prisma.notification.create({
    data: { userId, title, body },
  });
}

/**
 * Notify user in-app and optionally by SMS.
 * `sms` block triggers an outbound text when user.smsAlertsEnabled.
 */
export async function notifyUser(userId, { title, body, sms }) {
  await createInAppNotification(userId, title, body);

  if (!sms) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.smsAlertsEnabled || !user.phone) return;

  let message = sms.message;
  if (!message && sms.template === 'received' && sms.data) {
    message = formatReceivedMessage(sms.data);
  }
  if (!message && sms.template === 'deposit' && sms.data) {
    message = formatDepositMessage(sms.data);
  }
  if (!message && sms.template === 'balance' && sms.data?.wallet) {
    message = formatBalanceMessage(sms.data.wallet);
  }

  if (!message) return;

  try {
    await sendSms(user.phone, message, { userId, purpose: sms.purpose ?? 'alert' });
  } catch (error) {
    console.error('[notify] SMS failed (money already settled)', { userId, error });
  }
}

/** Alert recipient when money lands — app notification + automatic SMS. */
export async function notifyMoneyReceived(recipientId, { amount, currency, senderLabel }) {
  const user = await prisma.user.findUnique({
    where: { id: recipientId },
    include: { wallet: true },
  });
  if (!user?.wallet) return;

  const amountLabel =
    currency === 'kori'
      ? formatKori(amount)
      : `${amount.toLocaleString('fr-FR')} ${user.wallet.currency}`;

  await notifyUser(user.id, {
    title: 'Argent reçu',
    body: `${senderLabel ?? 'Quelqu\'un'} t'a envoyé ${amountLabel}`,
    sms: {
      purpose: 'receive_alert',
      template: 'received',
      data: {
        amount,
        currency,
        senderLabel,
        wallet: user.wallet,
      },
    },
  });
}

/** Alert user when a deposit / cash-in completes. */
export async function notifyDepositReceived(userId, { amount }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });
  if (!user?.wallet) return;

  const amountLabel = `${amount.toLocaleString('fr-FR')} ${user.wallet.currency}`;

  await notifyUser(user.id, {
    title: 'Dépôt confirmé',
    body: `${amountLabel} ajoutés à ton compte`,
    sms: {
      purpose: 'deposit_alert',
      template: 'deposit',
      data: { amount, wallet: user.wallet },
    },
  });
}
