import './env-bootstrap.js';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

/** Serverless-friendly Postgres URL (Supabase pooler + connection limit on Vercel). */
export function resolveDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;

  try {
    const url = new URL(raw);
    if (process.env.VERCEL) {
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '1');
      }
      if (!url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'require');
      }
      // Supabase transaction pooler (port 6543) requires pgbouncer mode.
      if (url.port === '6543' && !url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true');
      }
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function createClient() {
  const url = resolveDatabaseUrl();
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    ...(url ? { datasources: { db: { url } } } : {}),
  });
}

export const prisma = globalForPrisma.__keitPrisma ?? createClient();

// Reuse one client per serverless instance (Vercel lambda warm starts).
globalForPrisma.__keitPrisma = prisma;

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}
