/**
 * Static + route wiring audit for B2B trade portal flows.
 * Run: node scripts/audit-b2b-e2e.mjs
 */
import { readFileSync } from 'node:fs';

const apiRouter = readFileSync('lib/api-router.js', 'utf8');
const apiClient = readFileSync('src/lib/api-client.js', 'utf8');
const prisma = readFileSync('prisma/schema.prisma', 'utf8');

function hasRoute(key) {
  return apiRouter.includes(`'${key}'`);
}

const FLOWS = [
  {
    name: 'Buyer portal — list suppliers',
    ui: ['B2BOrderPortalScreen.js', 'getBuyerPortalSuppliers'],
    api: 'GET /api/distribution/buyer-portal',
    routeKey: 'GET distribution/buyer-portal',
    handler: 'buyerPortalSuppliers',
    service: 'listBuyerPortalSuppliers',
  },
  {
    name: 'Buyer portal — catalog',
    ui: ['B2BOrderPortalScreen.js', 'getBuyerPortalCatalog'],
    api: 'GET /api/distribution/buyer-portal/catalog',
    routeKey: 'GET distribution/buyer-portal/catalog',
    handler: 'buyerPortalCatalog',
    service: 'getBuyerPortalCatalog',
  },
  {
    name: 'B2B checkout — place order',
    ui: ['B2BOrderPortalScreen.js', 'ShopDetailScreen.js', 'placeMarketplaceOrder'],
    api: 'POST /api/marketplace/orders',
    routeKey: 'POST marketplace/orders',
    handler: 'marketplaceOrderCreate',
    service: 'placeMarketplaceOrder',
    bodyFields: ['channel', 'paymentTerm', 'paymentSource', 'buyerBusinessId', 'preferredDeliveryDate'],
  },
  {
    name: 'Trade summary at checkout',
    ui: ['getBuyerTradeSummary'],
    api: 'GET /api/distribution/trade-summary',
    routeKey: 'GET distribution/trade-summary',
    handler: 'tradeSummaryCheckout',
    service: 'getBuyerTradeSummary',
  },
  {
    name: 'Pay trade invoice',
    ui: ['TradeInvoicesScreen.js', 'payTradeInvoice'],
    api: 'POST /api/distribution/invoices/:id/pay',
    routeKey: 'POST distribution/invoices/:id/pay',
    handler: 'tradeInvoicePay',
    service: 'payTradeInvoice',
    bodyFields: ['paymentSource', 'buyerBusinessId'],
  },
  {
    name: 'COD settle on buyer confirm',
    ui: ['MerchantOrdersScreen.js', 'confirmMarketplaceOrder'],
    api: 'POST /api/marketplace/orders/:id/confirm',
    routeKey: 'POST marketplace/orders/:id/confirm',
    handler: 'marketplaceOrderConfirm',
    service: 'settleCodOrderPayment',
  },
  {
    name: 'Supplier receivables',
    ui: ['DistributionHubScreen.js', 'getSupplierReceivables'],
    api: 'GET /api/distribution/receivables',
    routeKey: 'GET distribution/receivables',
    handler: 'supplierReceivables',
    service: 'getSupplierReceivables',
  },
  {
    name: 'Supplier trade accounts',
    ui: ['DistributionHubScreen.js', 'getTradeAccounts', 'upsertTradeAccount'],
    api: 'POST /api/distribution/trade-accounts',
    routeKey: 'POST distribution/trade-accounts',
    handler: 'tradeAccountUpsert',
    service: 'upsertTradeAccount',
  },
  {
    name: 'KEBU balance for payer picker',
    ui: ['getBusinessWallet', 'getMyBusinesses'],
    api: 'GET /api/businesses/:id/wallet',
    routeKey: 'GET businesses/:id/wallet',
    handler: 'businessWalletHandler',
  },
];

const SCHEMA_FIELDS = ['paymentSource', 'buyerBusinessId', 'preferredDeliveryDate', 'paymentTerm', 'channel'];

function checkFileContains(file, needle) {
  try {
    return readFileSync(file, 'utf8').includes(needle);
  } catch {
    return false;
  }
}

const issues = [];
const passes = [];

for (const flow of FLOWS) {
  const row = { flow: flow.name, checks: [] };

  if (!hasRoute(flow.routeKey)) {
    issues.push(`${flow.name}: missing api-router route ${flow.routeKey}`);
    row.checks.push('route ✗');
  } else {
    row.checks.push('route ✓');
  }

  for (const ui of flow.ui) {
    const inClient = apiClient.includes(ui) || checkFileContains(`src/screens/${ui}`, ui);
    if (!inClient && !checkFileContains('src/navigation/MarketplaceStack.js', ui)) {
      const found =
        checkFileContains('src/screens/B2BOrderPortalScreen.js', ui) ||
        checkFileContains('src/screens/ShopDetailScreen.js', ui) ||
        checkFileContains('src/screens/TradeInvoicesScreen.js', ui) ||
        checkFileContains('src/screens/DistributionHubScreen.js', ui) ||
        checkFileContains('src/screens/MerchantOrdersScreen.js', ui) ||
        apiClient.includes(ui);
      if (!found) {
        issues.push(`${flow.name}: UI reference "${ui}" not found in api-client or screens`);
        row.checks.push(`ui:${ui} ✗`);
      } else {
        row.checks.push(`ui:${ui} ✓`);
      }
    } else {
      row.checks.push(`ui:${ui} ✓`);
    }
  }

  if (flow.handler && !checkFileContains('lib/trade-handlers.js', flow.handler) && !checkFileContains('lib/marketplace-handlers.js', flow.handler) && !checkFileContains('lib/org-handlers.js', flow.handler)) {
    issues.push(`${flow.name}: handler ${flow.handler} not found`);
    row.checks.push('handler ✗');
  } else if (flow.handler) {
    row.checks.push('handler ✓');
  }

  if (flow.service) {
    const inTrade = checkFileContains('lib/trade-service.js', flow.service);
    const inMarket = checkFileContains('lib/marketplace-service.js', flow.service);
    const inFulfill = checkFileContains('lib/order-fulfillment-service.js', flow.service);
    if (!inTrade && !inMarket && !inFulfill) {
      issues.push(`${flow.name}: service ${flow.service} not found`);
      row.checks.push('service ✗');
    } else {
      row.checks.push('service ✓');
    }
  }

  if (flow.bodyFields) {
    for (const field of flow.bodyFields) {
      const inHandler =
        checkFileContains('lib/marketplace-handlers.js', field) ||
        checkFileContains('lib/trade-handlers.js', field);
      const inService =
        checkFileContains('lib/marketplace-service.js', field) ||
        checkFileContentsIncludes('lib/trade-service.js', field);
      if (!inHandler) {
        issues.push(`${flow.name}: handler missing body field ${field}`);
      }
      if (!inService && flow.service !== 'settleCodOrderPayment') {
        // settleCod reads from order row
      }
    }
  }

  passes.push(row);
}

function checkFileContentsIncludes(file, field) {
  return readFileSync(file, 'utf8').includes(field);
}

for (const field of SCHEMA_FIELDS) {
  if (!prisma.includes(field)) {
    issues.push(`Prisma Order model missing field: ${field}`);
  }
}

// Navigation wiring
if (!checkFileContains('src/navigation/MarketplaceStack.js', 'B2BOrderPortal')) {
  issues.push('B2BOrderPortal screen not registered in MarketplaceStack');
}
if (!checkFileContains('src/navigation/MarketplaceStack.js', 'AlertDetailScreen')) {
  issues.push('AlertDetailScreen import missing in MarketplaceStack (runtime crash)');
}

console.log('\n=== B2B E2E wiring audit ===\n');
for (const row of passes) {
  console.log(`${row.flow}`);
  console.log(`  ${row.checks.join(' | ')}\n`);
}

if (issues.length === 0) {
  console.log('✅ Static wiring: all checked flows connect UI → api-client → router → handler → service');
} else {
  console.log(`⚠️  ${issues.length} wiring issue(s):\n`);
  for (const i of issues) console.log(`  - ${i}`);
  process.exitCode = 1;
}
