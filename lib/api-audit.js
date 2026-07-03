import { prisma } from './prisma.js';

export function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress ?? null;
}

export async function logApiCall(req, res, userId) {
  try {
    await prisma.apiAuditLog.create({
      data: {
        userId: userId ?? null,
        method: req.method ?? 'UNKNOWN',
        path: req.url?.split('?')[0] ?? req.path ?? '/',
        statusCode: res.statusCode || null,
        ip: clientIp(req),
        userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
      },
    });
  } catch (error) {
    console.error('[api-audit]', error);
  }
}
