/**
 * Scheduled payroll — runs on daily cron for employees with weekly/monthly schedules.
 * Uses business owner wallet; skips if insufficient funds (logged, no partial batch).
 */

import { prisma } from '../prisma.js';
import { reference } from '../../api/_lib/auth.js';
import { runMoneyTransaction, transferNational } from '../wallet-atomic.js';
import { notifyMoneyReceived } from '../notify-service.js';

function isPayDay(employee, now = new Date()) {
  if (employee.paySchedule === 'manual') return false;
  if (employee.paySchedule === 'weekly') {
    return employee.payDayOfWeek != null && now.getDay() === employee.payDayOfWeek;
  }
  if (employee.paySchedule === 'biweekly') {
    const week = Math.floor(now.getTime() / (7 * 24 * 3600 * 1000));
    return employee.payDayOfWeek != null && now.getDay() === employee.payDayOfWeek && week % 2 === 0;
  }
  if (employee.paySchedule === 'monthly') {
    return employee.payDayOfMonth != null && now.getDate() === employee.payDayOfMonth;
  }
  return false;
}

export async function runScheduledPayrollCron(db = prisma) {
  const employees = await db.payrollEmployee.findMany({
    where: { status: 'active', payAmount: { gt: 0 }, paySchedule: { not: 'manual' } },
    include: {
      user: { include: { wallet: true } },
      business: { include: { owner: { include: { wallet: true } } } },
    },
  });

  const now = new Date();
  const due = employees.filter((e) => isPayDay(e, now));
  const results = [];

  for (const employee of due) {
    const ownerWallet = employee.business.owner?.wallet;
    const recipientWallet = employee.user?.wallet;
    if (!ownerWallet || !recipientWallet) {
      results.push({ employeeId: employee.id, ok: false, error: 'missing_wallet' });
      continue;
    }

    const alreadyPaidToday = await db.payrollRun.findFirst({
      where: {
        employeeId: employee.id,
        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        status: 'completed',
      },
    });
    if (alreadyPaidToday) {
      results.push({ employeeId: employee.id, ok: true, skipped: 'already_paid_today' });
      continue;
    }

    const ref = reference('PAY');
    try {
      await runMoneyTransaction(db, async (tx) =>
        transferNational(tx, {
          amount: employee.payAmount,
          senderWalletId: ownerWallet.id,
          recipientWalletId: recipientWallet.id,
          senderUserId: employee.business.ownerId,
          recipientUserId: employee.userId,
          reference: ref,
          senderLedger: {
            type: 'payroll',
            counterpartyName: employee.user.name,
            counterpartyHandle: employee.user.handle,
            note: 'Paie programmée',
          },
          recipientLedger: {
            type: 'payroll',
            counterpartyName: employee.business.name,
            note: 'Paie programmée',
            reference: `${ref}-E`,
          },
        }),
      );

      await db.payrollRun.create({
        data: {
          businessId: employee.businessId,
          employeeId: employee.id,
          amount: employee.payAmount,
          reference: ref,
          note: 'Paie programmée (cron)',
          status: 'completed',
          scheduledAt: now,
          completedAt: now,
        },
      });

      await notifyMoneyReceived(employee.userId, {
        amount: employee.payAmount,
        currency: 'national',
        senderLabel: employee.business.name,
      });

      results.push({ employeeId: employee.id, ok: true, reference: ref });
    } catch (error) {
      results.push({
        employeeId: employee.id,
        ok: false,
        error: error instanceof Error ? error.message : 'pay_failed',
      });
    }
  }

  return { checked: employees.length, due: due.length, results };
}
