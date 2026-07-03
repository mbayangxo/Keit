/** External API resilience — 30s timeout, 3 retries, 5s gap. Ambiguous failures stay pending. */

// Env overrides exist so the test suite can exercise timeout paths quickly.
function envInt(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export const EXTERNAL_API_TIMEOUT_MS = envInt('EXTERNAL_API_TIMEOUT_MS', 30_000);
export const EXTERNAL_API_MAX_RETRIES = envInt('EXTERNAL_API_MAX_RETRIES', 3);
export const EXTERNAL_API_RETRY_GAP_MS = envInt('EXTERNAL_API_RETRY_GAP_MS', 5_000);

export const RAIL_PROCESSING_MESSAGE =
  'Ta transaction est en cours de traitement, nous te confirmerons dans les 5 minutes.';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

/**
 * Fetch JSON from an external partner API with timeout + retries.
 *
 * Returns:
 * - { ok: true, body, status }
 * - { ok: false, explicitFailure: true, body, status } — partner rejected request
 * - { ok: false, ambiguous: true, timeout?, error? } — unknown outcome → mark PENDING
 */
export async function fetchExternalJson(url, init = {}) {
  let lastError;

  for (let attempt = 1; attempt <= EXTERNAL_API_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), EXTERNAL_API_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (isRetryableStatus(response.status) && attempt < EXTERNAL_API_MAX_RETRIES) {
          await sleep(EXTERNAL_API_RETRY_GAP_MS);
          continue;
        }
        return {
          ok: false,
          explicitFailure: !isRetryableStatus(response.status),
          ambiguous: isRetryableStatus(response.status),
          body,
          status: response.status,
        };
      }

      return { ok: true, body, status: response.status };
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      const timedOut = error?.name === 'AbortError';

      if (attempt < EXTERNAL_API_MAX_RETRIES) {
        await sleep(EXTERNAL_API_RETRY_GAP_MS);
        continue;
      }

      return {
        ok: false,
        ambiguous: true,
        timeout: timedOut,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    ok: false,
    ambiguous: true,
    error: lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown'),
  };
}
