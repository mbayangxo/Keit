#!/usr/bin/env node
/**
 * Run the project's pinned Prisma CLI (node_modules), not a global Prisma 7 install.
 */
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const prismaBin = join(root, 'node_modules', '.bin', 'prisma');

if (!existsSync(prismaBin)) {
  console.error('Prisma CLI not found. Run: npm install');
  process.exit(1);
}

const args = process.argv.slice(2);
const result = spawnSync(prismaBin, args, {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
