#!/usr/bin/env node
/**
 * Build-time schema sync: keeps the production database matched to
 * prisma/schema.prisma on every Vercel deploy, so new tables/columns can
 * never be missing behind freshly deployed code.
 *
 * This step NEVER fails the build. A deploy that ships bug fixes with a
 * lagging schema beats no deploy at all — the API already reports schema
 * drift honestly at runtime (503 db_schema_outdated), and /api/health
 * shows loginSchemaOk + the live commit for diagnosis.
 *
 * Prefers DIRECT_DATABASE_URL when set: Supabase's transaction pooler
 * (port 6543) can refuse DDL — schema changes want the direct connection
 * (port 5432).
 */
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = (process.env.DIRECT_DATABASE_URL ?? process.env.DIRECT_URL ?? process.env.DATABASE_URL)?.trim();

if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
  console.warn(
    '[db-sync] ⚠️  No database URL available to this build — schema NOT synced.\n' +
      '[db-sync]     Vercel → Settings → Environment Variables → DATABASE_URL → enable for Production.',
  );
  process.exit(0);
}

console.log('[db-sync] Syncing database schema (prisma db push)…');
const prismaBin = join(root, 'node_modules', '.bin', 'prisma');
const push = spawnSync(prismaBin, ['db', 'push', '--skip-generate'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: url },
});

if (push.status !== 0) {
  console.warn(
    '\n[db-sync] ⚠️  Schema sync FAILED — deploying anyway so fixes still ship.\n' +
      '[db-sync]     The app will answer "Mise à jour en cours" on features whose tables are missing.\n' +
      '[db-sync]     Fix now: run `npm run db:push` from your laptop, or set DIRECT_DATABASE_URL\n' +
      '[db-sync]     in Vercel to the Supabase DIRECT connection string (port 5432, not 6543).\n',
  );
  process.exit(0);
}

console.log('[db-sync] ✓ Database schema is in sync.');
