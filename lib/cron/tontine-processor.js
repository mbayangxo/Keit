import { reference } from '../../api/_lib/auth.js';
import { transferNational, InsufficientFundsError, runMoneyTransaction } from '../wallet-atomic.js';
import { prisma } from '../prisma.js';
import { notifyMoneyReceived } from '../notify-service.js';
import { writeSecureLog } from '../secure-log.js';

const FREQUENCY_MS = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  hebdo: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  mensuel: 30 * 24 * 60 * 60 * 1000,
  'bi-mensuel': 15 * 24 * 60 * 60 * 1000,
};

function nextDueFrom(frequency, from = new Date()) {
  const ms = FREQUENCY_MS[String(frequency).toLowerCase()] ?? FREQUENCY_MS.monthly;
  return new Date(from.getTime() + ms);
}

/**
 * Daily 08:00 WAT: collect contributions from members and release pot to rotation winner.
 */
export async function runTontineProcessor(db = prisma) {
  const now = new Date();
  const due = await db.tontineGroup.findMany({
    where: {
      active: true,
      OR: [{ nextDueAt: { lte: now } }, { nextDueAt: null }],
    },
    include: {
      memberships: {
        include: { user: { include: { wallet: true } } },
        orderBy: { rotationOrder: 'asc' },
      },
    },
  });

  const results = [];

  for (const group of due) {
    const ref = reference('TONTINE');
    const memberCount = group.memberships.length;
    if (memberCount === 0) {
      results.push({ groupId: group.id, ok: false, error: 'no_members' });
      continue;
    }

    const collections = [];
    let collectionFailed = false;
    let payoutUserId = null;
    let payoutAmount = 0;
    const expectedPot = group.amountPerMember * memberCount;

    try {
      await runMoneyTransaction(db, async (tx) => {
        const potWallet = await tx.wallet.findUnique({ where: { userId: group.createdBy } });
        if (!potWallet) throw new Error('Creator wallet missing');

        for (const membership of group.memberships) {
          const memberWallet = membership.user.wallet;
          if (!memberWallet) {
            collectionFailed = true;
            collections.push({ userId: membership.userId, ok: false, error: 'no_wallet' });
            continue;
          }

          try {
            await transferNational(tx, {
              amount: group.amountPerMember,
              senderWalletId: memberWallet.id,
              recipientWalletId: potWallet.id,
              senderUserId: membership.userId,
              recipientUserId: group.createdBy,
              reference: `${ref}-C-${membership.userId}`,
              senderLedger: {
                type: 'tontine_contribution',
                counterpartyName: group.name,
                note: 'Cotisation tontine',
              },
              recipientLedger: {
                type: 'tontine_pot_in',
                counterpartyName: membership.user.name,
                note: 'Cotisation reçue',
                reference: `${ref}-C-${membership.userId}-R`,
              },
            });
            collections.push({ userId: membership.userId, amount: group.amountPerMember, ok: true });
          } catch (error) {
            collectionFailed = true;
            collections.push({
              userId: membership.userId,
              ok: false,
              error: error instanceof InsufficientFundsError ? 'insufficient' : 'failed',
            });
          }
        }

        const potBalance =
          (await tx.wallet.findUnique({ where: { id: potWallet.id } }))?.balance ?? 0;

        await tx.tontineGroup.update({
          where: { id: group.id },
          data: {
            potBalance,
            lastProcessedAt: now,
            nextDueAt: nextDueFrom(group.frequency, now),
          },
        });

        if (!collectionFailed && potBalance >= expectedPot) {
          const recipientMembership = group.memberships.find(
            (m) => m.rotationOrder === group.rotationIndex,
          );
          if (recipientMembership?.user.wallet) {
            const payoutRef = `${ref}-PAYOUT`;
            await transferNational(tx, {
              amount: potBalance,
              senderWalletId: potWallet.id,
              recipientWalletId: recipientMembership.user.wallet.id,
              senderUserId: group.createdBy,
              recipientUserId: recipientMembership.userId,
              reference: payoutRef,
              senderLedger: {
                type: 'tontine_payout',
                counterpartyName: recipientMembership.user.name,
                note: `Pot tontine ${group.name}`,
              },
              recipientLedger: {
                type: 'tontine_receive',
                counterpartyName: group.name,
                note: 'Pot tontine reçu',
                reference: `${payoutRef}-R`,
              },
            });

            await tx.tontineMembership.update({
              where: { id: recipientMembership.id },
              data: { hasReceivedPayout: true },
            });

            const nextIndex = (group.rotationIndex + 1) % memberCount;
            await tx.tontineGroup.update({
              where: { id: group.id },
              data: { rotationIndex: nextIndex, potBalance: 0 },
            });

            payoutUserId = recipientMembership.userId;
            payoutAmount = potBalance;
          }
        }
      });

      if (payoutUserId) {
        await notifyMoneyReceived(payoutUserId, {
          amount: payoutAmount,
          currency: 'national',
          senderLabel: group.name,
        });
      }

      results.push({
        groupId: group.id,
        ok: !collectionFailed,
        collected: collections.filter((c) => c.ok).length,
        payoutUserId,
        payoutAmount: payoutUserId ? payoutAmount : 0,
        partial: collectionFailed,
      });
    } catch (error) {
      console.error('[CRON tontine_processor]', group.id, error);
      results.push({
        groupId: group.id,
        ok: false,
        error: error instanceof Error ? error.message : 'failed',
      });
    }
  }

  if (results.length > 0) {
    await writeSecureLog({
      category: 'tontine_processor',
      severity: 'info',
      title: `Processed ${results.length} tontine groups`,
      payload: { results },
    });
  }

  return { job: 'tontine_processor', processed: results.length, results, ranAt: now.toISOString() };
}
