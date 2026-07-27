import { z } from 'zod';
import jwt from 'jsonwebtoken';
import {
  beginTotpSetup,
  bootstrapAdmin,
  confirmTotpSetup,
  getAdminFromBearer,
  legacyAdminKeyValid,
  loginAdmin,
  revokeAdminSession,
  verifyAdminTotp,
} from './admin-auth.js';
import {
  acknowledgeFraudAlert,
  adminApproveHeld,
  adminRejectHeld,
  AdminActionError,
  freezeUserAccount,
  getSupportTicketDetail,
  issueAdminRefund,
  releaseStuckRail,
  respondSupportTicket,
  unfreezeUserAccount,
  updateSupportTicketStatus,
} from './admin-actions-service.js';
import { getAdminDashboard, getTransactionDetail, listDailyReports } from './admin-dashboard-service.js';
import { listFraudAlerts, listHeldTransactions } from './held-transaction-service.js';
import {
  AgentError,
  agentErrorStatus,
  createAgentProfile,
  getAgentReconciliation,
  listAgents,
  topUpAgentFloat,
} from './agent-service.js';

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
}

export function assertAdminAccess(req, res) {
  if (req.adminId) return true;
  if (legacyAdminKeyValid(req)) {
    req.adminId = 'legacy-api-key';
    return true;
  }
  res.status(401).json({ error: 'Admin authorization required' });
  return false;
}

export async function adminAuthBootstrap(req, res) {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(12),
    name: z.string().optional(),
    bootstrapSecret: z.string().min(8),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });

  try {
    const admin = await bootstrapAdmin(parsed.data);
    res.status(201).json({ admin, message: 'Admin created. Log in and set up 2FA.' });
  } catch (error) {
    if (error.code === 'admin_exists') return res.status(409).json({ error: error.message });
    if (error.code === 'bootstrap_denied') return res.status(403).json({ error: error.message });
    throw error;
  }
}

export async function adminAuthLogin(req, res) {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

  try {
    const result = await loginAdmin({
      ...parsed.data,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
    });
    res.json(result);
  } catch (error) {
    if (error.code === 'invalid_credentials') return res.status(401).json({ error: 'Invalid credentials' });
    throw error;
  }
}

export async function adminAuthSetup2fa(req, res) {
  const schema = z.object({ challengeToken: z.string().min(10) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

  try {
    const setup = await beginTotpSetup(parsed.data.challengeToken);
    res.json(setup);
  } catch (error) {
    if (error.code === 'challenge_expired') return res.status(401).json({ error: error.message });
    throw error;
  }
}

export async function adminAuthConfirm2fa(req, res) {
  const schema = z.object({ challengeToken: z.string().min(10), code: z.string().length(6) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

  try {
    const session = await confirmTotpSetup(parsed.data.challengeToken, parsed.data.code, {
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
    });
    res.json({ ...session, totpEnabled: true });
  } catch (error) {
    if (error.code === 'challenge_expired' || error.code === 'invalid_totp') {
      return res.status(401).json({ error: error.message, code: error.code });
    }
    throw error;
  }
}

export async function adminAuthVerify2fa(req, res) {
  const schema = z.object({ challengeToken: z.string().min(10), code: z.string().length(6) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

  try {
    const session = await verifyAdminTotp(parsed.data.challengeToken, parsed.data.code, {
      ip: clientIp(req),
      userAgent: req.headers['user-agent'],
    });
    res.json(session);
  } catch (error) {
    if (error.code === 'challenge_expired' || error.code === 'invalid_totp') {
      return res.status(401).json({ error: error.message, code: error.code });
    }
    throw error;
  }
}

export async function adminAuthLogout(req, res) {
  const auth = await getAdminFromBearer(req.headers.authorization);
  if (auth) {
    const token = req.headers.authorization.slice(7);
    try {
      const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'dev-only-k21-admin-jwt-secret-min-32-chars!!');
      if (payload.sid) await revokeAdminSession(payload.sid);
    } catch {
      /* ignore */
    }
  }
  res.json({ ok: true });
}

export async function adminDashboard(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const data = await getAdminDashboard();
  res.json(data);
}

export async function adminTransactionDetail(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const id = req.query.id;
  const detail = await getTransactionDetail(id);
  if (!detail) return res.status(404).json({ error: 'Transaction not found' });
  res.json(detail);
}

export async function adminHeldTransactionsList(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const status = req.query.status ?? 'pending_review';
  const items = await listHeldTransactions({ status: String(status) });
  res.json(
    items.map((h) => ({
      id: h.id,
      userId: h.userId,
      operationType: h.operationType,
      status: h.status,
      amountNational: h.amountNational,
      flags: JSON.parse(h.flagsJson),
      reference: h.reference,
      expiresAt: h.expiresAt.toISOString(),
      createdAt: h.createdAt.toISOString(),
      alerts: h.fraudAlerts,
    })),
  );
}

export async function adminHeldTransactionApprove(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const schema = z.object({ note: z.string().optional() });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

  try {
    const result = await adminApproveHeld(req.adminId, req.query.id, parsed.data.note);
    res.json(result);
  } catch (error) {
    if (error instanceof AdminActionError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    throw error;
  }
}

export async function adminHeldTransactionReject(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const schema = z.object({ reason: z.string().min(3) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

  try {
    const held = await adminRejectHeld(req.adminId, req.query.id, parsed.data.reason);
    res.json(held);
  } catch (error) {
    if (error instanceof AdminActionError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    throw error;
  }
}

export async function adminFraudAlerts(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const alerts = await listFraudAlerts({ unacknowledgedOnly: true });
  res.json(alerts);
}

export async function adminFraudAlertAck(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const alert = await acknowledgeFraudAlert(req.adminId, req.query.id);
  res.json(alert);
}

export async function adminFreezeUser(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const schema = z.object({ reason: z.string().min(3) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

  try {
    const result = await freezeUserAccount(req.adminId, req.query.id, parsed.data.reason);
    res.json(result);
  } catch (error) {
    if (error instanceof AdminActionError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    throw error;
  }
}

export async function adminUnfreezeUser(req, res) {
  if (!assertAdminAccess(req, res)) return;
  try {
    const result = await unfreezeUserAccount(req.adminId, req.query.id);
    res.json(result);
  } catch (error) {
    if (error instanceof AdminActionError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    throw error;
  }
}

export async function adminReleaseRail(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const schema = z.object({
    action: z.enum(['complete', 'failed', 'poll']),
    note: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

  try {
    const status = parsed.data.action === 'complete' ? 'completed' : parsed.data.action;
    const rail = await releaseStuckRail(req.adminId, req.query.id, {
      action: status,
      note: parsed.data.note,
    });
    res.json(rail);
  } catch (error) {
    if (error instanceof AdminActionError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    throw error;
  }
}

export async function adminIssueRefund(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const schema = z.object({
    recipientUserId: z.string().min(1),
    amount: z.number().int().positive(),
    reason: z.string().min(3),
    originalRef: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

  try {
    const refund = await issueAdminRefund(req.adminId, parsed.data);
    res.status(201).json(refund);
  } catch (error) {
    if (error instanceof AdminActionError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    throw error;
  }
}

export async function adminSupportTicketsList(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const status = req.query.status;
  const where = status ? { status: String(status) } : {};
  const { prisma } = await import('./prisma.js');
  const rows = await prisma.supportTicket.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 100,
    include: {
      user: { select: { id: true, phone: true, name: true, handle: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  res.json(rows);
}

export async function adminSupportTicketGet(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const ticket = await getSupportTicketDetail(req.query.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
}

export async function adminSupportTicketReply(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const schema = z.object({ body: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

  try {
    const message = await respondSupportTicket(req.adminId, req.query.id, parsed.data.body);
    res.status(201).json(message);
  } catch (error) {
    if (error instanceof AdminActionError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    throw error;
  }
}

export async function adminSupportTicketPatch(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const schema = z.object({ status: z.enum(['open', 'pending', 'resolved', 'closed']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

  const ticket = await updateSupportTicketStatus(req.adminId, req.query.id, parsed.data.status);
  res.json(ticket);
}

export async function adminDailyReports(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const reports = await listDailyReports({ date: req.query.date });
  res.json(reports);
}

export async function adminDailyReportExport(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const reports = await listDailyReports({ date: req.query.date, limit: 1 });
  if (!reports.length) return res.status(404).json({ error: 'No report for date' });

  const report = reports[0];
  const format = req.query.format ?? 'json';
  if (format === 'csv') {
    const flat = report.report;
    const lines = ['key,value', ...Object.entries(flat).map(([k, v]) => `${k},"${JSON.stringify(v).replace(/"/g, '""')}"`)];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="k21-daily-${req.query.date ?? 'latest'}.csv"`);
    return res.send(lines.join('\n'));
  }
  res.setHeader('Content-Disposition', `attachment; filename="k21-daily-${req.query.date ?? 'latest'}.json"`);
  res.json(report);
}

export async function adminAgentsList(req, res) {
  if (!assertAdminAccess(req, res)) return;
  res.json({ agents: await listAgents() });
}

export async function adminAgentsCreate(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const schema = z.object({
    userId: z.string().min(1),
    displayName: z.string().min(2).max(80).optional(),
    locationLabel: z.string().max(120).optional(),
    floatLimit: z.number().int().positive().optional(),
    initialFloat: z.number().int().nonnegative().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });

  try {
    const agent = await createAgentProfile({
      ...parsed.data,
      adminId: req.adminId,
    });
    res.status(201).json({ agent });
  } catch (error) {
    if (error instanceof AgentError) {
      return res.status(agentErrorStatus(error)).json({ error: error.message, code: error.code });
    }
    throw error;
  }
}

export async function adminAgentsFloat(req, res) {
  if (!assertAdminAccess(req, res)) return;
  const schema = z.object({
    amountXof: z.number().int().positive(),
    note: z.string().max(200).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed' });

  try {
    const result = await topUpAgentFloat(req.query.id ?? req.params?.id, parsed.data.amountXof, req.adminId, parsed.data.note);
    res.json(result);
  } catch (error) {
    if (error instanceof AgentError) {
      return res.status(agentErrorStatus(error)).json({ error: error.message, code: error.code });
    }
    throw error;
  }
}

export async function adminAgentsReconcile(req, res) {
  if (!assertAdminAccess(req, res)) return;
  res.json(await getAgentReconciliation());
}
