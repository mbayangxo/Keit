#!/usr/bin/env node
/**
 * Build-time schema sync: keeps the production database matched to
 * prisma/schema.prisma on every Vercel deploy, so new tables/columns can
 * never be missing behind freshly deployed code.
 *
 * - No DATABASE_URL (e.g., a preview build without env) → skip quietly.
 * - Push fails → FAIL THE BUILD. Deploying code against a stale schema
 *   is how "error" screens happen; better to see it red in Vercel.
 *
 * Unlike db-setup.mjs (the interactive first-time script), this never
 * passes --accept-data-loss: a destructive change must be run manually
 * and on purpose.
 */
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.DATABASE_URL?.trim();

if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
  if (process.env.VERCEL_ENV === 'production') {
    console.error(
      '\n[db-sync] ❌ DATABASE_URL is not available to the PRODUCTION build.\n' +
        'The app would deploy against a database missing new tables/columns.\n' +
        'Fix: Vercel → Settings → Environment Variables → DATABASE_URL →\n' +
        'make sure "Production" is checked (build + runtime), then redeploy.\n',
    );
    process.exit(1);
  }
  console.log('[db-sync] DATABASE_URL not set for this build — skipping schema sync.');
  process.exit(0);
}

console.log('[db-sync] Syncing database schema (prisma db push)…');
const prismaBin = join(root, 'node_modules', '.bin', 'prisma');
const push = spawnSync(prismaBin, ['db', 'push', '--skip-generate'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

if (push.status !== 0) {
  console.error(
    '\n[db-sync] ❌ Schema sync failed — the build stops here on purpose.\n' +
      'The deployed app would crash against an out-of-date database.\n' +
      'If Prisma reported possible data loss, run the change manually:\n' +
      '  npm run db:push\n',
  );
  process.exit(1);
}

console.log('[db-sync] ✓ Database schema is in sync.');
