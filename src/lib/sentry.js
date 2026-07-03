import * as Sentry from '@sentry/react-native';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const SENSITIVE_KEYS = /pin|password|token|authorization|secret|otp|cni/i;

function scrubObject(value, depth = 0) {
  if (depth > 6 || value == null) return value;
  if (Array.isArray(value)) return value.map((v) => scrubObject(v, depth + 1));
  if (typeof value !== 'object') return value;
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEYS.test(key)) {
      out[key] = '[Filtered]';
    } else {
      out[key] = scrubObject(val, depth + 1);
    }
  }
  return out;
}

export const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: Platform.OS !== 'web',
});

let initialized = false;

export function initSentry() {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const enabled =
    !!dsn && (!__DEV__ || process.env.EXPO_PUBLIC_SENTRY_ENABLED === 'true');

  if (!dsn) {
    if (!__DEV__) {
      console.warn('[K21] EXPO_PUBLIC_SENTRY_DSN is not set — crash reporting disabled');
    }
    return;
  }

  Sentry.init({
    dsn,
    enabled,
    environment: __DEV__ ? 'development' : 'production',
    integrations: [
      navigationIntegration,
      ...(Platform.OS !== 'web' ? [Sentry.mobileReplayIntegration()] : []),
    ],
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: __DEV__ ? 0 : 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.headers) {
        event.request.headers = scrubObject(event.request.headers);
      }
      if (event.extra) event.extra = scrubObject(event.extra);
      return event;
    },
  });

  Sentry.setContext('device', {
    brand: Device.brand,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    platform: Platform.OS,
  });
}

export function captureApiError(error, context = {}) {
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) return;
  Sentry.withScope((scope) => {
    scope.setTag('layer', 'api-client');
    if (context.path) scope.setTag('api_path', context.path);
    if (context.status) scope.setExtra('http_status', context.status);
    if (context.code) scope.setExtra('error_code', context.code);
    Sentry.captureException(error);
  });
}

export function setSentryUser(userId) {
  if (!userId) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({ id: userId });
}

export { Sentry };
