import { koriToNational } from './kori.js';
import {
  HIGH_VALUE_XOF,
  isStepUpFresh,
  signStepUpToken,
  verifyStepUpToken,
} from './session-security.js';
import { prisma } from './prisma.js';

export class StepUpRequiredError extends Error {
  constructor() {
    super('Re-authentication required for this transaction');
    this.code = 'step_up_required';
    this.status = 403;
    this.name = 'StepUpRequiredError';
  }
}

export function amountToNationalXof(amount, currency, country) {
  if (currency === 'kori') return koriToNational(amount, country);
  return amount;
}

export async function assertStepUpForAmount(req, amountNational) {
  if (amountNational < HIGH_VALUE_XOF) return;

  const headerToken = req.headers['x-step-up-token'];
  if (typeof headerToken === 'string' && verifyStepUpToken(headerToken, req.userId)) {
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (user && isStepUpFresh(user.stepUpVerifiedAt)) {
    return;
  }

  throw new StepUpRequiredError();
}

export { HIGH_VALUE_XOF, signStepUpToken };
