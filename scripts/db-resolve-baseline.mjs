#!/usr/bin/env node
/** Mark 0_baseline as applied without running SQL (DB already has schema from db push). */
import { readFileSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error('DATABASE_URL missing — add Supabase URL to .env first.');
  process.exit(1);
}

const result = spawnSync('node', ['scripts/prisma-cli.mjs', 'migrate', 'resolve', '--applied', '0_baseline'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? 1);
