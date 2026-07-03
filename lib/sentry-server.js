import * as Sentry from '@sentry/node';

let initialized = false;

export function initServerSentry() {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

export function captureServerError(error, context = {}) {
  if (!process.env.SENTRY_DSN) {
    console.error('[api]', error);
    return;
  }
  Sentry.withScope((scope) => {
    if (context.path) scope.setTag('api_path', context.path);
    if (context.method) scope.setTag('http_method', context.method);
    if (context.userId) scope.setUser({ id: context.userId });
    if (context.adminId) scope.setTag('admin_id', context.adminId);
    Sentry.captureException(error);
  });
}

export { Sentry };
