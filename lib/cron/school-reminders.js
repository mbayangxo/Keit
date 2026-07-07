/**
 * School fee reminders — in-app + email only (no outbound SMS unless parent texts SOLDE).
 */

import { prisma } from '../prisma.js';
import { createInAppNotification } from '../notify-service.js';
import { sendAlertEmail } from '../email-service.js';

export async function runSchoolFeeReminders(db = prisma) {
  const now = new Date();
  const periods = await db.schoolFeePeriod.findMany({
    where: {
      status: 'open',
      dueDate: { lte: new Date(now.getTime() + 7 * 24 * 3600 * 1000) },
    },
    include: { business: true },
  });

  let reminded = 0;
  for (const period of periods) {
    const unpaid = await db.schoolFeePayment.findMany({
      where: {
        periodId: period.id,
        status: { not: 'paid' },
        OR: [{ reminderSentAt: null }, { reminderSentAt: { lt: new Date(now.getTime() - 3 * 24 * 3600 * 1000) } }],
      },
      include: { student: true },
    });

    for (const row of unpaid) {
      const parent = await db.user.findUnique({ where: { id: row.parentUserId } });
      const title = 'Frais scolaires en attente';
      const body = `${row.student.studentName} · ${period.label} — ${row.amount.toLocaleString('fr-FR')} XOF pour ${period.business.name}`;

      await createInAppNotification(row.parentUserId, title, body);
      if (parent?.email) {
        try {
          await sendAlertEmail(parent.email, title, body);
        } catch {
          /* email failure is non-blocking */
        }
      }

      await db.schoolFeePayment.update({
        where: { id: row.id },
        data: { reminderSentAt: now },
      });
      reminded += 1;
    }
  }

  return { periodsChecked: periods.length, remindersSent: reminded };
}
