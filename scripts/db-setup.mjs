#!/usr/bin/env node
/**
 * One-command DB setup for K21 beta.
 * Run from repo root: npm run db:setup
 */
import { readFileSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { normalizeDatabaseUrl } from '../lib/db-url.js';

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

const url = normalizeDatabaseUrl(process.env.DATABASE_URL?.trim());
if (url) process.env.DATABASE_URL = url;

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
      `Edit the file: ${join(process.cwd(), '.env')} — save it — then run npm run db:setup again.\n` +
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

const isLocalTestDb = /localhost|127\.0\.0\.1|:5121[0-9]/i.test(url);
if (isLocalTestDb) {
  console.warn(
    '⚠ DATABASE_URL points at a local/test Postgres (not Supabase).\n' +
      '  For integration tests: npm run test:db:start && npm run test:db:setup\n' +
      '  For production Supabase: paste the direct connection URI (port 5432) into .env\n',
  );
}

console.log('✓ DATABASE_URL looks valid');
console.log(isLocalTestDb ? '→ Pushing schema to local test DB…' : '→ Pushing schema to Supabase…');

const prismaCli = join(root, 'scripts', 'prisma-cli.mjs');
const push = spawnSync(process.execPath, [prismaCli, 'db', 'push', '--accept-data-loss'], {
  cwd: root,
  stdio: 'pipe',
  env: process.env,
  encoding: 'utf8',
});

if (push.stdout) process.stdout.write(push.stdout);
if (push.stderr) process.stderr.write(push.stderr);

if (push.status !== 0) {
  const combined = `${push.stdout ?? ''}\n${push.stderr ?? ''}`;
  if (/prepared statement.*already exists/i.test(combined)) {
    fail(
      'prisma db push failed: prepared statement conflict (PgBouncer transaction pooler).\n' +
        'Use Supabase → Database → Connection string → URI → Direct connection (port 5432) for db push,\n' +
        'not the transaction pooler (port 6543). Keep pooler URL for Vercel runtime if you prefer.',
    );
  }
  fail('prisma db push failed — check your Supabase URL and network.');
}

console.log('\n✅ Database ready. Test: https://keit-six.vercel.app/api/health should show db:"ok" after Vercel redeploy.');
