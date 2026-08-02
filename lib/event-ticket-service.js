import { randomBytes } from 'crypto';
import { buildTicketPassUrl } from './k21-qr.js';

function scanCode() {
  return `TKT-${randomBytes(5).toString('hex').toUpperCase()}`;
}

export function ticketPassShape(pass, event) {
  return {
    id: pass.id,
    scanCode: pass.scanCode,
    status: pass.status,
    checkedInAt: pass.checkedInAt?.toISOString() ?? null,
    qrUrl: buildTicketPassUrl(pass.scanCode),
    event: event
      ? {
          id: event.id,
          title: event.title,
          venue: event.venue,
          startsAt: event.startsAt.toISOString(),
        }
      : null,
  };
}

export function ticketShape(ticket, event, buyer) {
  return {
    id: ticket.id,
    eventId: ticket.eventId,
    quantity: ticket.quantity,
    amount: ticket.amount,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    event: event
      ? {
          id: event.id,
          title: event.title,
          venue: event.venue,
          startsAt: event.startsAt.toISOString(),
          ticketPrice: event.ticketPrice,
          promoterId: event.promoterId,
        }
      : null,
    buyer: buyer ? { id: buyer.id, name: buyer.name, handle: buyer.handle } : null,
    passes: (ticket.passes ?? []).map((p) => ticketPassShape(p, event)),
  };
}

export async function createTicketPasses(db, ticketId, quantity) {
  const rows = [];
  for (let i = 0; i < quantity; i += 1) {
    let code = scanCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const pass = await db.ticketPass.create({
          data: { ticketId, scanCode: code },
        });
        rows.push(pass);
        break;
      } catch (error) {
        if (error?.code === 'P2002') {
          code = scanCode();
          continue;
        }
        throw error;
      }
    }
  }
  return rows;
}

export async function countSoldTickets(db, eventId) {
  const agg = await db.ticket.aggregate({
    where: { eventId, status: { in: ['paid', 'partial_used'] } },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

export async function assertEventCapacity(db, event, quantity) {
  if (!event.capacity) return;
  const sold = await countSoldTickets(db, event.id);
  if (sold + quantity > event.capacity) {
    const err = new Error('Plus de places disponibles');
    err.code = 'event_sold_out';
    throw err;
  }
}

export async function checkInTicketPass(db, scanCode, scannerUserId) {
  const pass = await db.ticketPass.findUnique({
    where: { scanCode: String(scanCode ?? '').trim().toUpperCase() },
    include: {
      ticket: {
        include: {
          event: true,
          buyer: true,
        },
      },
    },
  });

  if (!pass) {
    const err = new Error('Billet introuvable');
    err.code = 'ticket_not_found';
    throw err;
  }

  if (pass.ticket.event.promoterId !== scannerUserId) {
    const err = new Error('Seul l\'organisateur peut scanner');
    err.code = 'not_promoter';
    throw err;
  }

  if (pass.status === 'used') {
    const err = new Error('Billet déjà scanné');
    err.code = 'ticket_used';
    err.pass = pass;
    throw err;
  }

  const now = new Date();
  const updated = await db.ticketPass.update({
    where: { id: pass.id },
    data: { status: 'used', checkedInAt: now, checkedInBy: scannerUserId },
  });

  const remaining = await db.ticketPass.count({
    where: { ticketId: pass.ticketId, status: 'valid' },
  });
  if (remaining === 0) {
    await db.ticket.update({ where: { id: pass.ticketId }, data: { status: 'used' } });
  } else {
    await db.ticket.update({ where: { id: pass.ticketId }, data: { status: 'partial_used' } });
  }

  return {
    pass: updated,
    ticket: pass.ticket,
    buyer: pass.ticket.buyer,
    event: pass.ticket.event,
  };
}
