import { prisma } from './prisma.js';
import { createInAppNotification } from './notify-service.js';

export function supportTicketShape(row) {
  return {
    id: row.id,
    subject: row.subject,
    status: row.status,
    priority: row.priority,
    channel: row.channel ?? 'app',
    csPhone: row.csPhone ?? null,
    resolvedAt: row.resolvedAt?.toISOString?.() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastMessage: row.messages?.[0]
      ? {
          body: row.messages[0].body,
          authorType: row.messages[0].authorType,
          createdAt: row.messages[0].createdAt.toISOString(),
        }
      : null,
  };
}

export async function createUserSupportTicket(db, { userId, subject, body, channel = 'app', csPhone }) {
  const ticket = await db.supportTicket.create({
    data: {
      userId,
      subject: subject.trim().slice(0, 120),
      channel,
      csPhone: csPhone?.trim() || null,
      messages: {
        create: {
          authorType: 'user',
          authorUserId: userId,
          body: body.trim(),
        },
      },
    },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  await createInAppNotification(
    userId,
    'Demande reçue',
    'Notre équipe te répond sous 24h ouvrées.',
    { kind: 'support_ticket', refId: ticket.id },
  );

  return supportTicketShape(ticket);
}

export async function listUserSupportTickets(db, userId) {
  const rows = await db.supportTicket.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  return rows.map(supportTicketShape);
}

export async function getUserSupportTicket(db, { userId, ticketId }) {
  const row = await db.supportTicket.findFirst({
    where: { id: ticketId, userId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!row) return null;
  return {
    ...supportTicketShape(row),
    messages: row.messages.map((m) => ({
      id: m.id,
      body: m.body,
      authorType: m.authorType,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function replyUserSupportTicket(db, { userId, ticketId, body }) {
  const ticket = await db.supportTicket.findFirst({ where: { id: ticketId, userId } });
  if (!ticket) throw new Error('Ticket not found');
  if (['closed', 'resolved'].includes(ticket.status)) throw new Error('Ticket closed');

  await db.supportTicketMessage.create({
    data: {
      ticketId,
      authorType: 'user',
      authorUserId: userId,
      body: body.trim(),
    },
  });

  const updated = await db.supportTicket.update({
    where: { id: ticketId },
    data: { status: ticket.status === 'resolved' ? 'open' : 'pending', updatedAt: new Date() },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  return supportTicketShape(updated);
}

export function getCustomerServiceContact() {
  return {
    phone: process.env.K21_CS_PHONE?.trim() || '+221 33 000 00 00',
    whatsapp: process.env.K21_CS_WHATSAPP?.trim() || process.env.K21_CS_PHONE?.trim() || null,
    hours: process.env.K21_CS_HOURS?.trim() || 'Lun–Sam 8h–20h (GMT)',
    email: process.env.K21_CS_EMAIL?.trim() || 'support@k21.sn',
  };
}
