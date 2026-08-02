/**
 * K21 governance model — phased transition for Cauris oversight.
 *
 * Phase 1 (launch): Company-led under licensed fiat rails + closed-loop Cauris.
 * Phase 2 (scale): Independent African foundation owns rulebook & reserve policy.
 * Phase 3 (regional): Multi-stakeholder council (gov, banks, telcos, civil society).
 *
 * Machine-readable phase + audit categories for admin exports and future regulator API.
 */

export const GOVERNANCE_PHASE = Object.freeze({
  COMPANY_LED: 1,
  FOUNDATION: 2,
  MULTI_STAKEHOLDER: 3,
});

export function currentGovernancePhase() {
  const raw = process.env.K21_GOVERNANCE_PHASE;
  const n = Number(raw);
  if (n === 2 || n === 3) return n;
  return GOVERNANCE_PHASE.COMPANY_LED;
}

export function governanceBodyLabel(phase = currentGovernancePhase()) {
  switch (phase) {
    case GOVERNANCE_PHASE.FOUNDATION:
      return process.env.K21_FOUNDATION_NAME ?? 'K21 Cauris Foundation (planned)';
    case GOVERNANCE_PHASE.MULTI_STAKEHOLDER:
      return process.env.K21_COUNCIL_NAME ?? 'Cauris Governance Council (planned)';
    default:
      return process.env.K21_OPERATOR_NAME ?? 'K21 Technology (operator)';
  }
}

export const AUDIT_CATEGORIES = Object.freeze({
  TRANSACTION: 'transaction',
  KYC: 'kyc',
  AML_HOLD: 'aml_hold',
  FRAUD: 'fraud',
  RESERVE_RECON: 'reserve_reconciliation',
  ADMIN_ACTION: 'admin_action',
  RAIL_SETTLEMENT: 'rail_settlement',
  POLICY_CHANGE: 'policy_change',
  REGULATOR_EXPORT: 'regulator_export',
});

export function governanceExportHeader(extra = {}) {
  return {
    exportedAt: new Date().toISOString(),
    governancePhase: currentGovernancePhase(),
    governanceBody: governanceBodyLabel(),
    operator: process.env.K21_OPERATOR_NAME ?? 'K21 Technology',
    caurisType: 'closed_loop_stored_value',
    notCryptocurrency: true,
    ...extra,
  };
}
