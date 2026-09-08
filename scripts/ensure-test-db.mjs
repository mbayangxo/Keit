#!/usr/bin/env node
/**
 * Fail fast with a clear message when integration tests have no Postgres.
 * Start the test DB first: npm run test:db:start
 */
import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { normalizeDatabaseUrl } from '../lib/db-url.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const urlPath = join(root, 'tests', 'helpers', '.test-db-url');

process.env.NODE_ENV ??= 'test';
const defaultTestUrl =
  'postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&pgbouncer=true&connection_limit=20&pool_timeout=120';
process.env.DATABASE_URL = normalizeDatabaseUrl(
  process.env.DATABASE_URL?.trim() ||
    (existsSync(urlPath) ? readFileSync(urlPath, 'utf8').trim() : '') ||
    defaultTestUrl,
);

const prismaBin = join(root, 'node_modules', '.bin', 'prisma');
if (!existsSync(prismaBin)) {
  console.error('Run npm install first.');
  process.exit(1);
}

const result = spawnSync(
  prismaBin,
  ['db', 'execute', '--stdin', '--url', process.env.DATABASE_URL],
  {
    cwd: root,
    input: 'SELECT 1;',
    encoding: 'utf8',
  },
);

if (result.status === 0) {
  process.exit(0);
}

console.error(`
Integration tests need a local Postgres.

  npm run test:db:start
  npm test

(${result.stderr?.trim() || result.stdout?.trim() || 'database unreachable'})
`);
process.exit(1);
