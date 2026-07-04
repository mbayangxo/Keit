#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Build-time fallback when DATABASE_URL is not injected yet (Vercel static build step).
const url =
  process.env.DATABASE_URL?.trim() ||
  process.env.database_url?.trim() ||
  'postgresql://build:build@127.0.0.1:5432/build?schema=public';

const result = spawnSync('npx', ['prisma', 'generate'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: url },
});

process.exit(result.status ?? 1);
