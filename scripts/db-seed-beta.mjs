#!/usr/bin/env node
/**
 * Seeds Discover + demo merchant data for beta testing.
 * Run after at least one user exists: npm run db:seed-beta
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

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
    process.env[key] = val;
  }
}

loadEnvFile();

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' }, include: { wallet: true } });
  if (!user) {
    console.error('No users in DB — sign up once in the app, then re-run npm run db:seed-beta');
    process.exit(1);
  }

  let business = await prisma.business.findFirst({ where: { ownerId: user.id, name: 'Dibiterie Chez Papa' } });
  if (!business) {
    business = await prisma.business.create({
      data: {
        ownerId: user.id,
        name: 'Dibiterie Chez Papa',
        category: 'restaurant',
        arrondissement: 'Médina',
        verified: true,
        members: { create: { userId: user.id, role: 'owner' } },
      },
    });
    console.log('Created business:', business.id);
  } else {
    console.log('Business exists:', business.id);
  }

  const productSpecs = [
    { title: 'Assiette Dibiterie', price: 1400, category: 'deal', description: '-30% K21 beta' },
    { title: 'Thiébou Yassa', price: 2000, category: 'food', description: 'Plat du jour' },
    { title: 'Livreur weekend', price: 5000, category: 'gig', description: 'Médina · Flexible' },
    { title: 'Photographe event', price: 15000, category: 'gig', description: 'Freelance · Ponctuel' },
  ];

  for (const spec of productSpecs) {
    const exists = await prisma.product.findFirst({ where: { title: spec.title, active: true } });
    if (!exists) {
      await prisma.product.create({
        data: { ...spec, businessId: business.id, inventory: 50, active: true },
      });
      console.log('Created product:', spec.title);
    }
  }

  const eventStart = new Date(Date.now() + 3 * 24 * 3600 * 1000);
  let event = await prisma.event.findFirst({ where: { title: 'Soirée Mbalax — Place Obélisque' } });
  if (!event) {
    event = await prisma.event.create({
      data: {
        promoterId: user.id,
        businessId: business.id,
        title: 'Soirée Mbalax — Place Obélisque',
        description: 'Concert gratuit beta K21',
        venue: 'Place de l’Obélisque',
        startsAt: eventStart,
        ticketPrice: 0,
        capacity: 500,
      },
    });
    console.log('Created event:', event.id);
  }

  const paidEventStart = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  let paidEvent = await prisma.event.findFirst({ where: { title: 'Nuit du Mbalax — Parcelles' } });
  if (!paidEvent) {
    paidEvent = await prisma.event.create({
      data: {
        promoterId: user.id,
        title: 'Nuit du Mbalax — Parcelles',
        venue: 'Espace Lamantin',
        startsAt: paidEventStart,
        ticketPrice: 3000,
        capacity: 200,
      },
    });
    console.log('Created paid event:', paidEvent.id);
  }

  console.log('\n✅ Beta seed complete.');
  console.log(`Set on Vercel + .env: EXPO_PUBLIC_DEMO_MERCHANT_ID=${business.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
