import { z } from 'zod';
import { prisma } from './prisma.js';
import { validationError } from './validation.js';
import { handleOrgAccessError, requireBusinessAdmin, requireBusinessMember } from './business-access.js';
import {
  addPayrollEmployee,
  createPayrollGroup,
  isMoneyError,
  listPayrollEmployees,
  listPayrollGroups,
  moneyErrorStatus,
  payEmployee,
  payEmployeeByHandle,
  runScheduledPayroll,
} from './payroll-service.js';
import {
  createFeePeriod,
  enrollStudent,
  feePeriodStatus,
  listFeePeriods,
  listStudents,
  parentPayFee,
  sendFeeRemindersForAdmin,
} from './school-service.js';
import {
  listDeliveries,
  logDelivery,
  payoutFarmerDeliveries,
  syncOfflineDeliveries,
  verifyDelivery,
} from './cooperative-service.js';
import {
  blockUser,
  listBlocks,
  submitReport,
  unblockUser,
} from './trust-safety-service.js';

function businessIdFromReq(req) {
  return String(req.query.id ?? req.query.businessId ?? '');
}

export async function businessesMine(req, res) {
  const owned = await prisma.business.findMany({
    where: { ownerId: req.userId },
    orderBy: { name: 'asc' },
  });
  const memberOf = await prisma.businessMember.findMany({
    where: { userId: req.userId, business: { ownerId: { not: req.userId } } },
    include: { business: true },
  });
  res.json({
    owned,
    member: memberOf.map((m) => ({ ...m.business, memberRole: m.role })),
  });
}

export async function businessDetail(req, res) {
  const id = businessIdFromReq(req);
  try {
    await requireBusinessMember(req.userId, id);
  } catch (error) {
    if (handleOrgAccessError(res, error)) return;
    throw error;
  }
  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true, handle: true, avatarEmoji: true } } } },
      _count: { select: { payrollEmployees: true, schoolStudents: true, products: true } },
    },
  });
  if (!business) {
    res.status(404).json({ error: 'Business not found' });
    return;
  }
  res.json(business);
}

export async function payrollGroupsHandler(req, res) {
  const businessId = businessIdFromReq(req);
  try {
    if (req.method === 'GET') {
      await requireBusinessMember(req.userId, businessId);
      res.json(await listPayrollGroups(businessId));
      return;
    }
    await requireBusinessAdmin(req.userId, businessId);
    const schema = z.object({ name: z.string().min(1), defaultPayAmount: z.number().int().positive().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const group = await createPayrollGroup(businessId, parsed.data);
    res.status(201).json(group);
  } catch (error) {
    if (handleOrgAccessError(res, error)) return;
    throw error;
  }
}

export async function payrollEmployeesHandler(req, res) {
  const businessId = businessIdFromReq(req);
  try {
    if (req.method === 'GET') {
      await requireBusinessMember(req.userId, businessId);
      res.json(await listPayrollEmployees(businessId));
      return;
    }
    await requireBusinessAdmin(req.userId, businessId);
    const schema = z.object({
      userHandle: z.string().min(3),
      userId: z.string().optional(),
      groupId: z.string().optional(),
      groupName: z.string().optional(),
      jobTitle: z.string().optional(),
      payAmount: z.number().int().positive().optional(),
      paySchedule: z.enum(['manual', 'weekly', 'biweekly', 'monthly']).optional(),
      payDayOfWeek: z.number().int().min(0).max(6).optional(),
      payDayOfMonth: z.number().int().min(1).max(28).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const employee = await addPayrollEmployee(businessId, parsed.data);
    res.status(201).json(employee);
  } catch (error) {
    if (handleOrgAccessError(res, error)) return;
    if (error.message) {
      res.status(404).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function payrollPayHandler(req, res) {
  const businessId = businessIdFromReq(req);
  const schema = z.object({
    employeeId: z.string().optional(),
    employeeHandle: z.string().optional(),
    amount: z.number().int().positive().optional(),
    note: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  if (!parsed.data.employeeId && !parsed.data.employeeHandle) {
    res.status(400).json({ error: 'employeeId or employeeHandle required' });
    return;
  }

  try {
    const outcome = parsed.data.employeeId
      ? await payEmployee({ req, res, businessId, ...parsed.data, employeeId: parsed.data.employeeId })
      : await payEmployeeByHandle({ req, res, businessId, ...parsed.data, employeeHandle: parsed.data.employeeHandle });
    if (outcome.held) return;
    res.status(201).json(outcome.result);
  } catch (error) {
    if (handleOrgAccessError(res, error)) return;
    if (isMoneyError(error)) {
      res.status(moneyErrorStatus(error)).json({ error: error.message });
      return;
    }
    if (error.message) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function payrollRunHandler(req, res) {
  const businessId = businessIdFromReq(req);
  const schema = z.object({ groupId: z.string().optional() });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const results = await runScheduledPayroll(businessId, { ...parsed.data, req, res });
    res.status(201).json({ runs: results });
  } catch (error) {
    if (handleOrgAccessError(res, error)) return;
    throw error;
  }
}

export async function schoolStudentsHandler(req, res) {
  const businessId = businessIdFromReq(req);
  try {
    if (req.method === 'GET') {
      await requireBusinessMember(req.userId, businessId);
      res.json(await listStudents(businessId));
      return;
    }
    await requireBusinessAdmin(req.userId, businessId);
    const schema = z.object({
      studentName: z.string().min(2),
      parentHandle: z.string().optional(),
      parentUserId: z.string().optional(),
      gradeLabel: z.string().optional(),
      externalId: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    if (!parsed.data.parentHandle && !parsed.data.parentUserId) {
      res.status(400).json({ error: 'parentHandle or parentUserId required' });
      return;
    }
    const student = await enrollStudent(businessId, parsed.data);
    res.status(201).json(student);
  } catch (error) {
    if (handleOrgAccessError(res, error)) return;
    if (error.message) {
      res.status(404).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function schoolPeriodsHandler(req, res) {
  const businessId = businessIdFromReq(req);
  try {
    if (req.method === 'GET') {
      await requireBusinessMember(req.userId, businessId);
      res.json(await listFeePeriods(businessId));
      return;
    }
    await requireBusinessAdmin(req.userId, businessId);
    const schema = z.object({
      label: z.string().min(2),
      amount: z.number().int().positive(),
      dueDate: z.string(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    const period = await createFeePeriod(businessId, parsed.data);
    res.status(201).json(period);
  } catch (error) {
    if (handleOrgAccessError(res, error)) return;
    throw error;
  }
}

export async function schoolPeriodStatusHandler(req, res) {
  const businessId = businessIdFromReq(req);
  const periodId = String(req.query.subId ?? '');
  try {
    await requireBusinessMember(req.userId, businessId);
    res.json(await feePeriodStatus(businessId, periodId));
  } catch (error) {
    if (handleOrgAccessError(res, error)) return;
    if (error.message) {
      res.status(404).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function schoolPayHandler(req, res) {
  const businessId = businessIdFromReq(req);
  const schema = z.object({ studentId: z.string(), periodId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const gate = await parentPayFee({ req, res, businessId, ...parsed.data });
    if (gate.held) return;
    res.status(201).json(gate.result);
  } catch (error) {
    if (isMoneyError(error)) {
      res.status(moneyErrorStatus(error)).json({ error: error.message });
      return;
    }
    if (error.message) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function schoolRemindHandler(req, res) {
  const businessId = businessIdFromReq(req);
  const periodId = String(req.body?.periodId ?? req.query.subId ?? '');
  if (!periodId) {
    res.status(400).json({ error: 'periodId required' });
    return;
  }
  try {
    const result = await sendFeeRemindersForAdmin(req.userId, businessId, periodId);
    res.json(result);
  } catch (error) {
    if (handleOrgAccessError(res, error)) return;
    throw error;
  }
}

export async function cooperativeDeliveriesHandler(req, res) {
  const businessId = businessIdFromReq(req);
  try {
    if (req.method === 'GET') {
      await requireBusinessMember(req.userId, businessId);
      const status = req.query.status ? String(req.query.status) : undefined;
      const farmerUserId = req.query.farmerUserId ? String(req.query.farmerUserId) : undefined;
      res.json(await listDeliveries(businessId, { status, farmerUserId }));
      return;
    }
    const schema = z.object({
      farmerUserId: z.string().optional(),
      farmerHandle: z.string().optional(),
      quantityTons: z.number().positive(),
      periodStart: z.string(),
      periodEnd: z.string(),
      note: z.string().optional(),
      offlineClientId: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);
    if (!parsed.data.farmerUserId && !parsed.data.farmerHandle) {
      res.status(400).json({ error: 'farmerUserId or farmerHandle required' });
      return;
    }
    let farmerUserId = parsed.data.farmerUserId;
    if (!farmerUserId && parsed.data.farmerHandle) {
      const handle = parsed.data.farmerHandle.replace(/^@/, '').toLowerCase();
      const farmer = await prisma.user.findUnique({ where: { handle } });
      if (!farmer) {
        res.status(404).json({ error: 'Paysan introuvable sur K21' });
        return;
      }
      farmerUserId = farmer.id;
    }
    const log = await logDelivery({
      businessId,
      loggedByUserId: req.userId,
      ...parsed.data,
      farmerUserId,
    });
    res.status(201).json(log);
  } catch (error) {
    if (handleOrgAccessError(res, error)) return;
    throw error;
  }
}

export async function cooperativeVerifyHandler(req, res) {
  const businessId = businessIdFromReq(req);
  const deliveryId = String(req.query.subId ?? '');
  const schema = z.object({ approved: z.boolean(), note: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const log = await verifyDelivery({
      businessId,
      deliveryId,
      verifierUserId: req.userId,
      ...parsed.data,
    });
    res.json(log);
  } catch (error) {
    if (handleOrgAccessError(res, error)) return;
    if (error.message) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function cooperativePayoutHandler(req, res) {
  const businessId = businessIdFromReq(req);
  const schema = z.object({
    farmerUserId: z.string(),
    deliveryIds: z.array(z.string()).optional(),
    ratePerTonXof: z.number().int().positive().optional(),
    note: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const outcome = await payoutFarmerDeliveries({ req, res, businessId, ...parsed.data });
    if (outcome.held) return;
    res.status(201).json(outcome);
  } catch (error) {
    if (handleOrgAccessError(res, error)) return;
    if (isMoneyError(error)) {
      res.status(moneyErrorStatus(error)).json({ error: error.message });
      return;
    }
    if (error.message) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
}

export async function offlineSyncHandler(req, res) {
  const schema = z.object({
    items: z.array(
      z.object({
        clientId: z.string(),
        entityType: z.string().optional(),
        payload: z.record(z.unknown()),
      }),
    ),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);
  const results = await syncOfflineDeliveries(req.userId, parsed.data.items);
  res.json({ synced: results });
}

export async function trustBlockHandler(req, res) {
  if (req.method === 'GET') {
    res.json(await listBlocks(req.userId));
    return;
  }

  const schema = z.object({
    blockedUserId: z.string().optional(),
    blockedBusinessId: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const block = await blockUser(req.userId, parsed.data);
    res.status(201).json(block);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function trustUnblockHandler(req, res) {
  const blockId = String(req.query.id ?? '');
  try {
    res.json(await unblockUser(req.userId, blockId));
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

export async function trustReportHandler(req, res) {
  const schema = z.object({
    targetUserId: z.string().optional(),
    targetBusinessId: z.string().optional(),
    category: z.enum(['scam', 'harassment', 'fake_merchant', 'fake_event', 'other']),
    reason: z.string().min(10).max(2000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const report = await submitReport(req.userId, parsed.data);
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
