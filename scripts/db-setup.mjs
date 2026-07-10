#!/usr/bin/env node
/**
 * One-command DB setup for K21 beta.
 * Run from repo root: npm run db:setup
 */
import { readFileSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile() {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // Always trust .env for setup (ignore stale DATABASE_URL exported in the shell).
    process.env[key] = val;
  }
}

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

loadEnvFile();

const url = process.env.DATABASE_URL?.trim();

if (!url) {
  fail(
    'DATABASE_URL is missing.\n' +
      '1. Copy .env.example to .env\n' +
      '2. Paste your Supabase Postgres URL (Transaction pooler, port 6543)\n' +
      '   Must start with postgresql:// — NOT file:./dev.db (that is the old /server folder)\n' +
      '3. Run: npm run db:setup'
  );
}

if (url.startsWith('file:')) {
  fail(
    'DATABASE_URL is set to SQLite (file:./dev.db).\n' +
      'The main K21 app uses Postgres in prisma/schema.prisma.\n' +
      'Use your Supabase connection string in .env — see docs/K21-BETA-DAKAR.md'
  );
}

if (!/^postgres(ql)?:\/\//i.test(url)) {
  fail(
    `DATABASE_URL must start with postgresql://\n` +
      `You have: ${url.slice(0, 50)}${url.length > 50 ? '…' : ''}\n\n` +
      'Do NOT type a label like "your-supabase-uri". Copy the full line from Supabase:\n' +
      '  Dashboard → Project Settings → Database → Connection string\n' +
      '  → URI tab → Method: Transaction pooler → Copy\n' +
      'It looks like:\n' +
      '  postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-....pooler.supabase.com:6543/postgres\n\n' +
      'Paste that entire string as DATABASE_URL in .env (quotes are fine).'
  );
}

const PLACEHOLDER =
  /:\/\/USER:|^postgresql:\/\/USER|@HOST[/:]|:PASSWORD@|your-supabase|replace-with|xxx\.supabase|example\.com/i;

if (PLACEHOLDER.test(url)) {
  fail(
    'DATABASE_URL still looks like the .env.example template (USER, PASSWORD, or HOST).\n' +
      'Edit the file: /Users/mbayangdiallo/keit/.env — save it — then run npm run db:setup again.\n' +
      'Supabase → Settings → Database → Connection string → URI'
  );
}

// Unencoded @ in the password breaks parsing (shows up as !@@ before the hostname).
if (/:[^/@]+@[^/@]+@/.test(url)) {
  fail(
    'Your password contains @ — it must be URL-encoded as %40 in DATABASE_URL.\n' +
      'Example: if your password is MyPass@123, use MyPass%40123 in the connection string.'
  );
}

console.log('✓ DATABASE_URL looks valid');
console.log('→ Pushing schema to Supabase…');

const prismaBin = join(root, 'node_modules', '.bin', 'prisma');
const push = spawnSync(prismaBin, ['db', 'push', '--accept-data-loss'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

if (push.status !== 0) {
  fail('prisma db push failed — check your Supabase URL and network.');
}

console.log('\n✅ Database ready. Test: https://keit-six.vercel.app/api/health should show db:"ok" after Vercel redeploy.');
