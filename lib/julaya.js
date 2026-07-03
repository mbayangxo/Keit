/**
 * Julaya rail adapter — BCEAO-licensed partner for Orange Money / Wave / Free Money.
 * Built for failure: timeout → pending, retries, idempotency keys.
 */

import { fetchExternalJson } from './external-fetch.js';
import { julayaConfig, julayaConfigured, julayaMode } from './payment-config.js';

export { julayaConfigured, julayaMode } from './payment-config.js';

export const JULAYA_OPERATORS = ['orange_money', 'wave', 'free_money'];

function mapOperator(operator) {
  return { orange_money: 'ORANGE', wave: 'WAVE', free_money: 'FREE' }[operator];
}

function sandboxResult(reference, status = 'completed') {
  return {
    mode: 'sandbox',
    status,
    externalId: `sandbox-${reference}`,
    reference,
    message: 'Settled instantly in mock sandbox (no Julaya API key)',
  };
}

function parseLiveStatus(raw) {
  const value = String(raw ?? 'pending').toLowerCase();
  if (['completed', 'success', 'succeeded', 'paid'].includes(value)) return 'completed';
  if (['failed', 'error', 'rejected', 'cancelled'].includes(value)) return 'failed';
  if (['processing', 'in_progress'].includes(value)) return 'processing';
  return 'pending';
}

function liveResult(reference, body) {
  const externalId = String(body.id ?? body.transaction_id ?? body.reference ?? reference);
  return {
    mode: julayaMode(),
    status: parseLiveStatus(body.status),
    externalId,
    reference,
    message: typeof body.message === 'string' ? body.message : undefined,
    raw: body,
  };
}

function pendingResult(reference, reason) {
  return {
    mode: julayaMode(),
    status: 'pending',
    externalId: null,
    reference,
    ambiguous: true,
    message: reason,
  };
}

async function julayaRequest(path, { method = 'POST', body, idempotencyKey }) {
  const cfg = julayaConfig();

  if (cfg.mode === 'mock') {
    return { mock: true };
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${cfg.apiKey}`,
    'Idempotency-Key': idempotencyKey,
  };

  const result = await fetchExternalJson(`${cfg.apiUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return result;
}

async function initiateRail(path, params) {
  const cfg = julayaConfig();

  if (cfg.mode === 'mock') {
    return sandboxResult(params.reference);
  }

  const payload = {
    reference: params.reference,
    amount: params.amount,
    currency: 'XOF',
    phone: params.phone,
    operator: mapOperator(params.operator),
    callback_url: params.callbackUrl,
    idempotency_key: params.idempotencyKey,
  };

  const result = await julayaRequest(path, {
    method: 'POST',
    body: payload,
    idempotencyKey: params.idempotencyKey,
  });

  if (result.mock) {
    return sandboxResult(params.reference);
  }

  if (result.ok) {
    return liveResult(params.reference, result.body);
  }

  if (result.explicitFailure) {
    const detail = typeof result.body?.message === 'string' ? result.body.message : `Julaya HTTP ${result.status}`;
    return {
      mode: julayaMode(),
      status: 'failed',
      externalId: null,
      reference: params.reference,
      message: detail,
    };
  }

  return pendingResult(
    params.reference,
    result.timeout ? 'Partner API timed out after retries' : 'Partner API unavailable — outcome unknown',
  );
}

export async function initiateCashIn(params) {
  return initiateRail('/collections/mobile-money', params);
}

export async function initiateCashOut(params) {
  return initiateRail('/transfers/mobile-money', params);
}

export async function getRailStatus(externalId) {
  const cfg = julayaConfig();
  if (cfg.mode === 'mock') {
    return {
      mode: 'sandbox',
      status: 'completed',
      externalId,
      reference: externalId.replace(/^sandbox-/, ''),
    };
  }

  const result = await julayaRequest(`/transactions/${encodeURIComponent(externalId)}`, {
    method: 'GET',
    idempotencyKey: `status:${externalId}`,
  });

  if (result.ok) {
    const reference = String(result.body.reference ?? externalId);
    return liveResult(reference, result.body);
  }

  return pendingResult(externalId, 'Unable to confirm partner status');
}

export function verifyWebhookSignature(_headers, _rawBody) {
  const { webhookSecret } = julayaConfig();
  if (!webhookSecret) return julayaConfig().mode === 'mock';
  return false;
}

export function parseWebhookPayload(body) {
  if (!body || typeof body !== 'object') return {};
  return body;
}
