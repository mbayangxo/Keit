import './env-bootstrap.js';
import { PrismaClient } from '@prisma/client';
import { normalizeDatabaseUrl } from './db-url.js';

const globalForPrisma = globalThis;

/** Serverless-friendly Postgres URL (Supabase pooler + connection limit on Vercel). */
export function resolveDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;
  return normalizeDatabaseUrl(raw);
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
