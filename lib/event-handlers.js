import { z } from 'zod';
import { prisma } from './prisma.js';
import { validationError } from './validation.js';
import {
  assertEventCapacity,
  checkInTicketPass,
  createTicketPasses,
  ticketPassShape,
  ticketShape,
} from './event-ticket-service.js';

export async function eventsMine(req, res) {
  const rows = await prisma.event.findMany({
    where: { promoterId: req.userId },
    orderBy: { startsAt: 'asc' },
    include: { _count: { select: { tickets: true } } },
  });
  res.json(
    rows.map((e) => ({
      id: e.id,
      title: e.title,
      venue: e.venue,
      startsAt: e.startsAt.toISOString(),
      ticketPrice: e.ticketPrice,
      capacity: e.capacity,
      ticketSales: e._count.tickets,
    })),
  );
}

export async function ticketsMine(req, res) {
  const rows = await prisma.ticket.findMany({
    where: { buyerId: req.userId, status: { not: 'cancelled' } },
    orderBy: { createdAt: 'desc' },
    include: {
      event: true,
      passes: { orderBy: { createdAt: 'asc' } },
    },
  });
  res.json(rows.map((t) => ticketShape(t, t.event, null)));
}

export async function eventCheckIn(req, res) {
  const schema = z.object({ scanCode: z.string().min(6) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const result = await checkInTicketPass(prisma, parsed.data.scanCode, req.userId);
    res.json({
      ok: true,
      pass: ticketPassShape(result.pass, result.event),
      buyer: { name: result.buyer.name, handle: result.buyer.handle },
      event: { id: result.event.id, title: result.event.title },
    });
  } catch (error) {
    if (error.code === 'ticket_not_found') {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.code === 'not_promoter') {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error.code === 'ticket_used') {
      res.status(409).json({
        error: error.message,
        pass: ticketPassShape(error.pass, error.pass.ticket.event),
      });
      return;
    }
    throw error;
  }
}

export async function eventScanStats(req, res) {
  const eventId = req.query.id;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.promoterId !== req.userId) {
    res.status(404).json({ error: 'Événement introuvable' });
    return;
  }

  const [soldAgg, checkedIn] = await Promise.all([
    prisma.ticket.aggregate({ where: { eventId }, _sum: { quantity: true } }),
    prisma.ticketPass.count({
      where: { ticket: { eventId }, status: 'used' },
    }),
  ]);

  res.json({
    eventId,
    title: event.title,
    capacity: event.capacity,
    sold: soldAgg._sum.quantity ?? 0,
    checkedIn,
  });
}