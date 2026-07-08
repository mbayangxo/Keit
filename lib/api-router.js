import { setCors, readJson, validationError } from '../api/_lib/http.js';
import { getUserIdFromRequest } from '../api/_lib/auth.js';
import { logApiCall } from './api-audit.js';
import { databaseConfigured } from './prisma.js';
import { captureServerError } from './sentry-server.js';
import {
  health,
  authPhone,
  authEmail,
  authVerify,
  authRecover,
  authRefresh,
  authCompleteProfile,
  cultureFeed,
  getMe,
  meUpdate,
  mePhoneRequest,
  mePhoneConfirm,
  usersLookup,
  getWallet,
  getTransactions,
  transfersSend,
  transferUndo,
  transfersRequest,
  transfersRequestsList,
  transfersRequestById,
  transfersRequestAccept,
  transfersRequestDeny,
  transfersRequestCancel,
  cashIn,
  cashOut,
  depositsNational,
  mboloThreads,
  mboloThreadMessages,
  events,
  eventsTickets,
  products,
  businessesList,
  businessesCreate,
  merchantPay,
  tontineGroups,
  tontineRelease,
  friendsHandler,
  friendsRemove,
  notificationsList,
  notificationsRead,
} from './handlers.js';
import { cronDailyAll } from './cron/http-handlers.js';
import {
  businessesMine,
  businessDetail,
  payrollGroupsHandler,
  payrollEmployeesHandler,
  payrollPayHandler,
  payrollRunHandler,
  schoolStudentsHandler,
  schoolPeriodsHandler,
  schoolPeriodStatusHandler,
  schoolPayHandler,
  schoolRemindHandler,
  cooperativeDeliveriesHandler,
  cooperativeVerifyHandler,
  cooperativePayoutHandler,
  offlineSyncHandler,
  trustBlockHandler,
  trustUnblockHandler,
  trustReportHandler,
} from './org-handlers.js';

/** @typedef {{ auth: boolean, handler: (req: import('http').IncomingMessage, res: import('http').ServerResponse) => Promise<void> }} RouteDef */

/** @type {Record<string, RouteDef>} */
const ROUTES = {
  'GET health': { auth: false, handler: health },
  'POST auth/phone': { auth: false, handler: authPhone },
  'POST auth/email': { auth: false, handler: authEmail },
  'POST auth/recover': { auth: false, handler: authRecover },
  'POST auth/verify': { auth: false, handler: authVerify },
  'POST auth/refresh': { auth: false, handler: authRefresh },
  'POST auth/complete-profile': { auth: true, handler: authCompleteProfile },
  'GET culture/feed': { auth: true, handler: cultureFeed },
  'GET me': { auth: true, handler: getMe },
  'PATCH me': { auth: true, handler: meUpdate },
  'POST me/phone': { auth: true, handler: mePhoneRequest },
  'POST me/phone/confirm': { auth: true, handler: mePhoneConfirm },
  'GET users/lookup': { auth: true, handler: usersLookup },
  'GET wallet': { auth: true, handler: getWallet },
  'GET transactions': { auth: true, handler: getTransactions },
  'POST transfers/send': { auth: true, handler: transfersSend },
  'POST transfers/:reference/undo': { auth: true, handler: transferUndo },
  'POST transfers/request': { auth: true, handler: transfersRequest },
  'GET transfers/requests': { auth: true, handler: transfersRequestsList },
  'GET transfers/requests/:id': { auth: true, handler: transfersRequestById },
  'POST transfers/requests/:id/accept': { auth: true, handler: transfersRequestAccept },
  'POST transfers/requests/:id/deny': { auth: true, handler: transfersRequestDeny },
  'POST transfers/requests/:id/cancel': { auth: true, handler: transfersRequestCancel },
  'POST cash/in': { auth: true, handler: cashIn },
  'POST cash/out': { auth: true, handler: cashOut },
  'POST deposits/national': { auth: true, handler: depositsNational },
  'GET mbolo/threads': { auth: true, handler: mboloThreads },
  'POST mbolo/threads': { auth: true, handler: mboloThreads },
  'GET mbolo/threads/:id/messages': { auth: true, handler: mboloThreadMessages },
  'POST mbolo/threads/:id/messages': { auth: true, handler: mboloThreadMessages },
  'GET events': { auth: true, handler: events },
  'POST events': { auth: true, handler: events },
  'POST events/:id/tickets': { auth: true, handler: eventsTickets },
  'GET products': { auth: true, handler: products },
  'POST products': { auth: true, handler: products },
  'GET businesses': { auth: true, handler: businessesList },
  'GET businesses/mine': { auth: true, handler: businessesMine },
  'GET businesses/:id': { auth: true, handler: businessDetail },
  'POST businesses': { auth: true, handler: businessesCreate },
  'GET businesses/:id/payroll/groups': { auth: true, handler: payrollGroupsHandler },
  'POST businesses/:id/payroll/groups': { auth: true, handler: payrollGroupsHandler },
  'GET businesses/:id/payroll/employees': { auth: true, handler: payrollEmployeesHandler },
  'POST businesses/:id/payroll/employees': { auth: true, handler: payrollEmployeesHandler },
  'POST businesses/:id/payroll/pay': { auth: true, handler: payrollPayHandler },
  'POST businesses/:id/payroll/run': { auth: true, handler: payrollRunHandler },
  'GET businesses/:id/school/students': { auth: true, handler: schoolStudentsHandler },
  'POST businesses/:id/school/students': { auth: true, handler: schoolStudentsHandler },
  'GET businesses/:id/school/periods': { auth: true, handler: schoolPeriodsHandler },
  'POST businesses/:id/school/periods': { auth: true, handler: schoolPeriodsHandler },
  'GET businesses/:id/school/periods/:subId/status': { auth: true, handler: schoolPeriodStatusHandler },
  'POST businesses/:id/school/pay': { auth: true, handler: schoolPayHandler },
  'POST businesses/:id/school/remind': { auth: true, handler: schoolRemindHandler },
  'GET businesses/:id/cooperative/deliveries': { auth: true, handler: cooperativeDeliveriesHandler },
  'POST businesses/:id/cooperative/deliveries': { auth: true, handler: cooperativeDeliveriesHandler },
  'POST businesses/:id/cooperative/deliveries/:subId/verify': { auth: true, handler: cooperativeVerifyHandler },
  'POST businesses/:id/cooperative/payout': { auth: true, handler: cooperativePayoutHandler },
  'POST offline/sync': { auth: true, handler: offlineSyncHandler },
  'GET trust/blocks': { auth: true, handler: trustBlockHandler },
  'POST trust/block': { auth: true, handler: trustBlockHandler },
  'DELETE trust/block/:id': { auth: true, handler: trustUnblockHandler },
  'POST trust/report': { auth: true, handler: trustReportHandler },
  'POST merchants/:id/pay': { auth: true, handler: merchantPay },
  'GET tontine/groups': { auth: true, handler: tontineGroups },
  'POST tontine/groups': { auth: true, handler: tontineGroups },
  'POST tontine/groups/:id/release': { auth: true, handler: tontineRelease },
  'GET friends': { auth: true, handler: friendsHandler },
  'POST friends': { auth: true, handler: friendsHandler },
  'DELETE friends/:id': { auth: true, handler: friendsRemove },
  'GET notifications': { auth: true, handler: notificationsList },
  'POST notifications/:id/read': { auth: true, handler: notificationsRead },
  'GET cron/daily': { auth: false, handler: cronDailyAll },
  'POST cron/daily': { auth: false, handler: cronDailyAll },
};

const PARAM_PATTERNS = [
  [/^businesses\/mine$/, 'businesses/mine'],
  [/^businesses\/([^/]+)\/payroll\/groups$/, 'businesses/:id/payroll/groups'],
  [/^businesses\/([^/]+)\/payroll\/employees$/, 'businesses/:id/payroll/employees'],
  [/^businesses\/([^/]+)\/payroll\/pay$/, 'businesses/:id/payroll/pay'],
  [/^businesses\/([^/]+)\/payroll\/run$/, 'businesses/:id/payroll/run'],
  [/^businesses\/([^/]+)\/school\/students$/, 'businesses/:id/school/students'],
  [/^businesses\/([^/]+)\/school\/periods\/([^/]+)\/status$/, 'businesses/:id/school/periods/:subId/status'],
  [/^businesses\/([^/]+)\/school\/periods$/, 'businesses/:id/school/periods'],
  [/^businesses\/([^/]+)\/school\/pay$/, 'businesses/:id/school/pay'],
  [/^businesses\/([^/]+)\/school\/remind$/, 'businesses/:id/school/remind'],
  [/^businesses\/([^/]+)\/cooperative\/deliveries\/([^/]+)\/verify$/, 'businesses/:id/cooperative/deliveries/:subId/verify'],
  [/^businesses\/([^/]+)\/cooperative\/deliveries$/, 'businesses/:id/cooperative/deliveries'],
  [/^businesses\/([^/]+)\/cooperative\/payout$/, 'businesses/:id/cooperative/payout'],
  [/^businesses\/([^/]+)$/, 'businesses/:id'],
  [/^trust\/block\/([^/]+)$/, 'trust/block/:id'],
  [/^transfers\/([^/]+)\/undo$/, 'transfers/:reference/undo'],
  [/^mbolo\/threads\/([^/]+)\/messages$/, 'mbolo/threads/:id/messages'],
  [/^transfers\/requests\/([^/]+)\/accept$/, 'transfers/requests/:id/accept'],
  [/^transfers\/requests\/([^/]+)\/deny$/, 'transfers/requests/:id/deny'],
  [/^transfers\/requests\/([^/]+)\/cancel$/, 'transfers/requests/:id/cancel'],
  [/^transfers\/requests\/([^/]+)$/, 'transfers/requests/:id'],
  [/^events\/([^/]+)\/tickets$/, 'events/:id/tickets'],
  [/^merchants\/([^/]+)\/pay$/, 'merchants/:id/pay'],
  [/^tontine\/groups\/([^/]+)\/release$/, 'tontine/groups/:id/release'],
  [/^friends\/([^/]+)$/, 'friends/:id'],
  [/^notifications\/([^/]+)\/read$/, 'notifications/:id/read'],
];

function matchRoute(method, path) {
  const direct = ROUTES[`${method} ${path}`];
  if (direct) return { route: direct, params: {} };

  for (const [regex, key] of PARAM_PATTERNS) {
    const m = path.match(regex);
    if (m) {
      const route = ROUTES[`${method} ${key}`];
      if (route) {
        const params = { id: m[1] };
        if (key.includes(':subId') && m[2]) params.subId = m[2];
        if (key.includes(':reference') && m[1]) params.reference = m[1];
        return { route, params };
      }
    }
  }

  return null;
}

function enforceHttps(req, res) {
  if (process.env.NODE_ENV !== 'production') return true;
  const proto = req.headers['x-forwarded-proto'];
  if (proto && proto !== 'https') {
    res.status(403).json({ error: 'HTTPS required' });
    return false;
  }
  return true;
}

export async function dispatchApi(req, res, pathSegments) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!enforceHttps(req, res)) return;

  const path = Array.isArray(pathSegments) ? pathSegments.filter(Boolean).join('/') : String(pathSegments ?? '');
  const matched = matchRoute(req.method, path);
  if (!matched) {
    res.status(404).json({ error: 'Not found', path: `/api/${path}` });
    return;
  }

  if (matched.params && Object.keys(matched.params).length) {
    req.query = { ...req.query, ...matched.params };
  }

  let userId = null;
  try {
    if (matched.route.auth) {
      userId = await getUserIdFromRequest(req);
      if (!userId) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }
      req.userId = userId;
    }

    await matched.route.handler(req, res);
  } catch (error) {
    console.error('[api]', path, error);
    captureServerError(error, { path: `/api/${path}`, method: req.method, userId });
    if (!res.headersSent) {
      const prismaInit =
        error.name === 'PrismaClientInitializationError' ||
        error.code === 'P1001' ||
        error.message?.includes('DATABASE_URL');
      if (prismaInit) {
        res.status(503).json({
          error: databaseConfigured() ? 'Database temporarily unavailable' : 'Server not configured — DATABASE_URL missing',
          code: 'db_unavailable',
        });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  } finally {
    await logApiCall(req, res, userId);
  }
}

export async function prepareApiBody(req) {
  req.body = await readJson(req);
}

export { validationError };
