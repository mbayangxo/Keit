import { z } from 'zod';
import { prisma } from './prisma.js';
import {
  AgentError,
  agentErrorStatus,
  agentShape,
  agentDepositShape,
  confirmAgentDeposit,
  createAgentDepositSession,
  getAgentByUserId,
  getAgentDepositByReference,
  listAgentFloatEntries,
  requireActiveAgent,
  scanAgentDeposit,
} from './agent-service.js';
import {
  createStripeDepositSession,
  getStripeDepositStatus,
  settleStripeDepositFromSession,
  stripeConfigured,
  verifyStripeWebhook,
} from './stripe-service.js';
import { validationError } from './validation.js';
import { gateOrExecute } from './risk-gate.js';
import { walletShape } from './kori.js';

function handleAgentError(res, error) {
  if (error instanceof AgentError) {
    res.status(agentErrorStatus(error)).json({ error: error.message, code: error.code });
    return true;
  }
  return false;
}

export async function depositAgentCreate(req, res) {
  const schema = z.object({ amount: z.number().int().positive() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const session = await createAgentDepositSession(req.userId, parsed.data.amount);
    res.status(201).json(session);
  } catch (error) {
    if (handleAgentError(res, error)) return;
    throw error;
  }
}

export async function depositAgentStatus(req, res) {
  const ref = req.query?.reference ?? req.query?.id ?? req.params?.reference;
  if (!ref) return res.status(400).json({ error: 'Reference required' });

  const deposit = await getAgentDepositByReference(ref, req.userId);
  if (!deposit) return res.status(404).json({ error: 'Not found' });
  res.json(deposit);
}

export async function depositCardSession(req, res) {
  if (!stripeConfigured()) {
    return res.status(503).json({ error: 'Dépôt carte indisponible', code: 'stripe_disabled' });
  }

  const schema = z.object({ amount: z.number().int().positive() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const session = await createStripeDepositSession(req.userId, parsed.data.amount);
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ error: error.message ?? 'Stripe session failed' });
  }
}

export async function depositCardStatus(req, res) {
  const ref = req.query?.reference ?? req.query?.id ?? req.params?.reference;
  if (!ref) return res.status(400).json({ error: 'Reference required' });

  const deposit = await getStripeDepositStatus(ref, req.userId);
  if (!deposit) return res.status(404).json({ error: 'Not found' });
  res.json(deposit);
}

export async function webhooksStripe(req, res) {
  if (!stripeConfigured()) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const rawBody = req.rawBody ?? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {}));
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = verifyStripeWebhook(rawBody, signature);
  } catch (error) {
    return res.status(400).json({ error: `Webhook signature failed: ${error.message}` });
  }
  if (!event) {
    return res.status(503).json({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
  }

  if (event.type === 'checkout.session.completed') {
    const result = await settleStripeDepositFromSession(event.data.object);
    return res.json({ received: true, ...result });
  }

  res.json({ received: true, handled: false, type: event.type });
}

export async function agentMe(req, res) {
  try {
    const agent = await requireActiveAgent(req.userId);
    const entries = await listAgentFloatEntries(agent.id, 20);
    res.json({
      agent: agentShape(agent),
      recentFloatEntries: entries.map((e) => ({
        id: e.id,
        type: e.type,
        amountXof: e.amountXof,
        balanceAfter: e.balanceAfter,
        reference: e.reference,
        note: e.note,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (handleAgentError(res, error)) return;
    throw error;
  }
}

export async function agentDepositScan(req, res) {
  const schema = z.object({
    token: z.string().min(8).optional(),
    qr: z.string().min(8).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  const token = parsed.data.token ?? parsed.data.qr?.match(/agent-deposit\/([^/?#]+)/i)?.[1] ?? parsed.data.qr;
  if (!token) return res.status(400).json({ error: 'Token or QR required' });

  try {
    const deposit = await scanAgentDeposit(token.trim(), req.userId);
    res.json({ deposit });
  } catch (error) {
    if (handleAgentError(res, error)) return;
    throw error;
  }
}

export async function agentDepositConfirm(req, res) {
  const depositId = req.query?.id ?? req.params?.id;
  if (!depositId) return res.status(400).json({ error: 'Deposit id required' });

  try {
    const pending = await prisma.agentDeposit.findUnique({
      where: { id: depositId },
      include: { user: { select: { id: true, name: true, phone: true, handle: true, verificationTier: true } } },
    });
    if (!pending || pending.status !== 'pending') {
      return res.status(404).json({ error: 'Dépôt introuvable ou déjà traité', code: 'invalid_deposit' });
    }
    if (pending.expiresAt < new Date()) {
      return res.status(409).json({ error: 'QR expiré', code: 'expired' });
    }

    const gate = await gateOrExecute(
      req,
      res,
      {
        operationType: 'agent_deposit',
        amountNational: pending.amountXof,
        recipientId: pending.userId,
        hasNationalDepositProof: true,
        payload: { depositId, agentUserId: req.userId },
      },
      async () => {
        const result = await confirmAgentDeposit(depositId, req.userId);
        const agent = await getAgentByUserId(req.userId);
        return {
          status: 201,
          body: {
            ok: true,
            deposit: result.deposit,
            wallet: result.wallet ? walletShape(result.wallet) : null,
            mint: result.mint,
            agent: agentShape({ ...agent, floatBalance: result.agentFloatBalance }),
            user: agentDepositShape(pending, pending.user).user,
          },
        };
      },
    );
    if (gate.held) return;
    res.status(gate.result.status).json(gate.result.body);
  } catch (error) {
    if (handleAgentError(res, error)) return;
    throw error;
  }
}
