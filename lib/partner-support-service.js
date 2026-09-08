import { prisma } from './prisma.js';
import { canonicalPhone, phoneVariants } from './phone-normalize.js';

export class PartnerSupportError extends Error {
  constructor(message, status = 400, code = 'invalid') {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'PartnerSupportError';
  }
}

async function findUserByPhone(phone) {
  const variants = phoneVariants(phone);
  if (!variants.length) return null;
  return prisma.user.findFirst({
    where: { phone: { in: variants } },
    select: { id: true, phone: true, name: true, handle: true },
  });
}

function agentShape(a) {
  return {
    id: a.id,
    partner_id: a.partnerId,
    shop_external_id: a.shopExternalId,
    joko_user_id: a.jokoUserId,
    name: a.name,
    role: a.role,
    active: a.active,
    user: a.user
      ? { id: a.user.id, name: a.user.name, handle: a.user.handle, phone: a.user.phone }
      : undefined,
    created_at: a.createdAt.toISOString(),
  };
}

function threadShape(t) {
  return {
    id: t.id,
    partner_id: t.partnerId,
    shop_external_id: t.shopExternalId,
    order_id: t.orderId,
    customer_phone: t.customerPhone,
    customer_user_id: t.customerUserId,
    mbolo_thread_id: t.mboloThreadId,
    status: t.status,
    assigned_agent_id: t.assignedAgentId,
    subject: t.subject,
    metadata: t.metadataJson
      ? (() => {
          try {
            return JSON.parse(t.metadataJson);
          } catch {
            return {};
          }
        })()
      : {},
    created_at: t.createdAt.toISOString(),
    updated_at: t.updatedAt.toISOString(),
  };
}

/** Register a CS agent — must already be a Joko user (by phone). */
export async function registerSupportAgent(partnerId, body) {
  const phone = canonicalPhone(String(body.phone ?? ''));
  if (!phone) throw new PartnerSupportError('phone required (agent must have a Joko account)');

  const user = await findUserByPhone(phone);
  if (!user) {
    throw new PartnerSupportError(
      'No Joko user for this phone — agent must install Joko and verify phone first',
      404,
      'user_not_found',
    );
  }

  const shopExternalId =
    typeof body.shop_external_id === 'string' ? body.shop_external_id.trim().slice(0, 120) : null;
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : user.name;
  const role = body.role === 'lead' ? 'lead' : 'agent';

  const existing = await prisma.partnerSupportAgent.findUnique({
    where: { partnerId_jokoUserId: { partnerId, jokoUserId: user.id } },
    include: { user: { select: { id: true, name: true, handle: true, phone: true } } },
  });
  if (existing) {
    const updated = await prisma.partnerSupportAgent.update({
      where: { id: existing.id },
      data: { name, role, shopExternalId, active: true },
      include: { user: { select: { id: true, name: true, handle: true, phone: true } } },
    });
    return { agent: updated, created: false };
  }

  const agent = await prisma.partnerSupportAgent.create({
    data: {
      partnerId,
      jokoUserId: user.id,
      shopExternalId,
      name,
      role,
      active: true,
    },
    include: { user: { select: { id: true, name: true, handle: true, phone: true } } },
  });
  return { agent, created: true };
}

export async function listSupportAgents(partnerId, { shopExternalId } = {}) {
  const where = { partnerId, active: true };
  if (shopExternalId) where.shopExternalId = shopExternalId;
  return prisma.partnerSupportAgent.findMany({
    where,
    include: { user: { select: { id: true, name: true, handle: true, phone: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Open or reuse a support thread for a shop order / customer.
 * Creates a Mbolo partner thread when customer (and optionally agent) are Joko users.
 */
export async function openSupportThread(partnerId, body) {
  const customerPhone = canonicalPhone(String(body.customer_phone ?? body.phone ?? ''));
  if (!customerPhone) throw new PartnerSupportError('customer_phone required');

  const orderId = typeof body.order_id === 'string' ? body.order_id.trim().slice(0, 120) : null;
  const shopExternalId =
    typeof body.shop_external_id === 'string' ? body.shop_external_id.trim().slice(0, 120) : null;
  const subject =
    typeof body.subject === 'string'
      ? body.subject.trim().slice(0, 200)
      : orderId
        ? `Order ${orderId}`
        : 'Customer support';
  const metadata =
    body.metadata && typeof body.metadata === 'object' ? body.metadata : {};

  if (orderId) {
    const existing = await prisma.partnerSupportThread.findFirst({
      where: { partnerId, orderId, status: { in: ['open', 'assigned'] } },
      orderBy: { updatedAt: 'desc' },
    });
    if (existing) return { thread: existing, created: false };
  }

  const customer = await findUserByPhone(customerPhone);
  const systemUserId =
    process.env.PARTNER_MESSAGING_USER_ID?.trim() || process.env.PARTNER_SETTLEMENT_USER_ID?.trim();

  let mboloThreadId = null;
  if (customer && systemUserId) {
    const commerceRef = `support:${partnerId}:${orderId || customerPhone}`;
    let thread = await prisma.mboloThread.findFirst({
      where: { type: 'partner', commerceType: 'support', commerceRefId: commerceRef },
    });
    if (!thread) {
      const memberCreates = [
        { userId: systemUserId, role: 'system' },
        { userId: customer.id, role: 'member' },
      ];
      thread = await prisma.mboloThread.create({
        data: {
          creatorId: systemUserId,
          name: subject.slice(0, 80),
          type: 'partner',
          commerceType: 'support',
          commerceRefId: commerceRef,
          members: { create: memberCreates },
        },
      });
    }
    mboloThreadId = thread.id;

    if (body.initial_message) {
      await prisma.mboloMessage.create({
        data: {
          threadId: thread.id,
          senderId: systemUserId,
          body: String(body.initial_message).slice(0, 4000),
          kind: 'text',
        },
      });
    }
  }

  const row = await prisma.partnerSupportThread.create({
    data: {
      partnerId,
      shopExternalId,
      orderId,
      customerPhone,
      customerUserId: customer?.id ?? null,
      mboloThreadId,
      status: 'open',
      subject,
      metadataJson: JSON.stringify({ partner: partnerId, kind: 'support', ...metadata }),
    },
  });

  return { thread: row, created: true };
}

export async function listSupportThreads(partnerId, { status, shopExternalId } = {}) {
  const where = { partnerId };
  if (status) where.status = status;
  if (shopExternalId) where.shopExternalId = shopExternalId;
  return prisma.partnerSupportThread.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
}

export async function assignSupportThread(partnerId, threadId, agentId) {
  const thread = await prisma.partnerSupportThread.findFirst({ where: { id: threadId, partnerId } });
  if (!thread) throw new PartnerSupportError('Thread not found', 404, 'not_found');

  const agent = await prisma.partnerSupportAgent.findFirst({
    where: { id: agentId, partnerId, active: true },
  });
  if (!agent) throw new PartnerSupportError('Agent not found', 404, 'agent_not_found');

  // Add agent to Mbolo thread if present
  if (thread.mboloThreadId) {
    const existing = await prisma.mboloMember.findFirst({
      where: { threadId: thread.mboloThreadId, userId: agent.jokoUserId },
    });
    if (!existing) {
      await prisma.mboloMember.create({
        data: { threadId: thread.mboloThreadId, userId: agent.jokoUserId, role: 'agent' },
      });
    }
  }

  return prisma.partnerSupportThread.update({
    where: { id: thread.id },
    data: { assignedAgentId: agent.id, status: 'assigned', updatedAt: new Date() },
  });
}

export async function postSupportMessage(partnerId, threadId, body) {
  const thread = await prisma.partnerSupportThread.findFirst({ where: { id: threadId, partnerId } });
  if (!thread) throw new PartnerSupportError('Thread not found', 404, 'not_found');

  const text = String(body.text ?? '').trim();
  if (!text) throw new PartnerSupportError('text required');

  const fromAgentId = body.agent_id ? String(body.agent_id) : thread.assignedAgentId;
  let senderId =
    process.env.PARTNER_MESSAGING_USER_ID?.trim() || process.env.PARTNER_SETTLEMENT_USER_ID?.trim();

  if (fromAgentId) {
    const agent = await prisma.partnerSupportAgent.findFirst({
      where: { id: fromAgentId, partnerId, active: true },
    });
    if (!agent) throw new PartnerSupportError('Agent not found', 404, 'agent_not_found');
    senderId = agent.jokoUserId;
  }

  if (!senderId) {
    throw new PartnerSupportError('PARTNER_MESSAGING_USER_ID required to post messages', 503, 'no_sender');
  }

  if (!thread.mboloThreadId) {
    throw new PartnerSupportError(
      'Customer has no Joko account — use POST /v1/messages/send (SMS) for this phone',
      409,
      'no_mbolo_thread',
    );
  }

  const msg = await prisma.mboloMessage.create({
    data: {
      threadId: thread.mboloThreadId,
      senderId,
      body: text.slice(0, 4000),
      kind: 'text',
    },
  });
  await prisma.mboloThread.update({ where: { id: thread.mboloThreadId }, data: { updatedAt: new Date() } });
  await prisma.partnerSupportThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });

  return {
    id: msg.id,
    thread_id: thread.id,
    mbolo_thread_id: thread.mboloThreadId,
    status: 'sent',
    channel_used: 'mbolo',
  };
}

export { agentShape, threadShape };
