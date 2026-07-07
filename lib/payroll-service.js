import { prisma } from './prisma.js';
import { reference } from '../api/_lib/auth.js';
import { gateOrExecute } from './risk-gate.js';
import { assertStepUpForAmount } from './step-up.js';
import {
  InsufficientFundsError,
  isMoneyError,
  moneyErrorStatus,
  runMoneyTransaction,
  transferNational,
} from './wallet-atomic.js';
import { txShape } from './shapes.js';
import { notifyMoneyReceived } from './notify-service.js';
import { requireBusinessAdmin } from './business-access.js';

export async function listPayrollGroups(businessId) {
  return prisma.payrollGroup.findMany({
    where: { businessId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { employees: true } } },
  });
}

export async function createPayrollGroup(businessId, { name, defaultPayAmount }) {
  return prisma.payrollGroup.create({
    data: {
      businessId,
      name,
      ...(defaultPayAmount != null ? { defaultPayAmount } : {}),
    },
  });
}

export async function listPayrollEmployees(businessId) {
  return prisma.payrollEmployee.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, handle: true, phone: true, avatarEmoji: true } },
      group: { select: { id: true, name: true } },
    },
  });
}

export async function addPayrollEmployee(businessId, data) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { handle: data.userHandle.replace(/^@/, '').toLowerCase() },
        ...(data.userId ? [{ id: data.userId }] : []),
      ],
    },
  });
  if (!user) throw new Error('Employee user not found');

  let groupId = data.groupId ?? null;
  if (data.groupName && !groupId) {
    let group = await prisma.payrollGroup.findFirst({ where: { businessId, name: data.groupName } });
    if (!group) {
      group = await prisma.payrollGroup.create({ data: { businessId, name: data.groupName } });
    }
    groupId = group.id;
  }

  const employee = await prisma.payrollEmployee.upsert({
    where: { businessId_userId: { businessId, userId: user.id } },
    update: {
      groupId,
      jobTitle: data.jobTitle ?? undefined,
      payAmount: data.payAmount ?? undefined,
      paySchedule: data.paySchedule ?? undefined,
      payDayOfWeek: data.payDayOfWeek ?? undefined,
      payDayOfMonth: data.payDayOfMonth ?? undefined,
      status: 'active',
    },
    create: {
      businessId,
      userId: user.id,
      groupId,
      jobTitle: data.jobTitle ?? 'staff',
      payAmount: data.payAmount ?? null,
      paySchedule: data.paySchedule ?? 'manual',
      payDayOfWeek: data.payDayOfWeek ?? null,
      payDayOfMonth: data.payDayOfMonth ?? null,
    },
    include: {
      user: { select: { id: true, name: true, handle: true } },
      group: true,
    },
  });

  await prisma.businessMember.upsert({
    where: { businessId_userId_role: { businessId, userId: user.id, role: data.jobTitle ?? 'staff' } },
    update: {},
    create: { businessId, userId: user.id, role: data.jobTitle ?? 'staff' },
  });

  return employee;
}

async function executePayrollTransfer({ req, res, business, employee, amount, note, ownerWallet }) {
  const txRef = reference('PAY');
  const gate = await gateOrExecute(
    req,
    res,
    {
      operationType: 'payroll',
      amountNational: amount,
      recipientHandle: employee.user.handle,
      recipientId: employee.userId,
      payload: {
        amount,
        senderUserId: req.userId,
        recipientUserId: employee.userId,
        senderWalletId: ownerWallet.id,
        recipientWalletId: employee.user.wallet.id,
      },
    },
    async (ref) => {
      const entry = await runMoneyTransaction(prisma, async (db) =>
        transferNational(db, {
          amount,
          senderWalletId: ownerWallet.id,
          recipientWalletId: employee.user.wallet.id,
          senderUserId: req.userId,
          recipientUserId: employee.userId,
          reference: ref,
          senderLedger: {
            type: 'payroll',
            counterpartyName: employee.user.name,
            counterpartyHandle: employee.user.handle,
            note,
          },
          recipientLedger: {
            type: 'payroll',
            counterpartyName: business.name,
            note,
            reference: `${ref}-E`,
          },
        }),
      );
      await prisma.payrollRun.create({
        data: {
          businessId: business.id,
          employeeId: employee.id,
          amount,
          reference: ref,
          note,
          status: 'completed',
          completedAt: new Date(),
        },
      });
      return txShape(entry);
    },
  );

  if (gate.held) return { held: true, ...gate };

  await notifyMoneyReceived(employee.userId, {
    amount,
    currency: 'national',
    senderLabel: business.name,
  });

  return { held: false, result: gate.result };
}

export async function payEmployee({ req, res, businessId, employeeId, amount, note }) {
  await requireBusinessAdmin(req.userId, businessId);
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  const ownerWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: req.userId } });

  const employee = await prisma.payrollEmployee.findFirst({
    where: { id: employeeId, businessId, status: 'active' },
    include: { user: { include: { wallet: true } } },
  });
  if (!employee?.user?.wallet) throw new Error('Employee not found');

  const payAmount = amount ?? employee.payAmount;
  if (!payAmount || payAmount <= 0) throw new Error('Invalid pay amount');

  await assertStepUpForAmount(req, payAmount);
  return executePayrollTransfer({ req, res, business, employee, amount: payAmount, note, ownerWallet });
}

export async function payEmployeeByHandle({ req, res, businessId, employeeHandle, amount, note }) {
  await requireBusinessAdmin(req.userId, businessId);
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  const ownerWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: req.userId } });

  const handle = employeeHandle.replace(/^@/, '').toLowerCase();
  const employee = await prisma.payrollEmployee.findFirst({
    where: { businessId, status: 'active', user: { handle } },
    include: { user: { include: { wallet: true } } },
  });
  if (!employee?.user?.wallet) throw new Error('Employee not found');

  const payAmount = amount ?? employee.payAmount;
  if (!payAmount || payAmount <= 0) throw new Error('Invalid pay amount');

  await assertStepUpForAmount(req, payAmount);
  return executePayrollTransfer({ req, res, business, employee, amount: payAmount, note, ownerWallet });
}

export async function runScheduledPayroll(businessId, { groupId, req, res }) {
  await requireBusinessAdmin(req.userId, businessId);
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  const ownerWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: req.userId } });

  const employees = await prisma.payrollEmployee.findMany({
    where: {
      businessId,
      status: 'active',
      ...(groupId ? { groupId } : {}),
      payAmount: { gt: 0 },
    },
    include: { user: { include: { wallet: true } } },
  });

  const results = [];
  for (const employee of employees) {
    try {
      const outcome = await executePayrollTransfer({
        req,
        res,
        business,
        employee,
        amount: employee.payAmount,
        note: 'Paie automatique',
        ownerWallet,
      });
      results.push({ employeeId: employee.id, ok: !outcome.held, ...outcome });
    } catch (error) {
      results.push({
        employeeId: employee.id,
        ok: false,
        error: error.message,
        status: isMoneyError(error) ? moneyErrorStatus(error) : 500,
      });
    }
  }
  return results;
}

export { isMoneyError, moneyErrorStatus, InsufficientFundsError };
