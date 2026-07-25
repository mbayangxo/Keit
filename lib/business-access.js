import { prisma } from './prisma.js';

export class OrgAccessError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.name = 'OrgAccessError';
    this.status = status;
  }
}

const ADMIN_ROLES = new Set(['owner', 'admin', 'ceo', 'cfo', 'hr_admin']);
const FINANCE_ROLES = new Set(['owner', 'admin', 'ceo', 'cfo']);
const PAY_ROLES = new Set(['owner', 'admin', 'ceo', 'cfo', 'hr_admin']);

export async function requireBusinessFinance(userId, businessId, db = prisma) {
  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) throw new OrgAccessError('Business not found', 404);
  if (business.ownerId === userId) return business;

  const member = await db.businessMember.findFirst({
    where: { businessId, userId, role: { in: [...FINANCE_ROLES] } },
  });
  if (!member) throw new OrgAccessError('Not authorized for treasury on this business');
  return business;
}

export async function requireBusinessPay(userId, businessId, db = prisma) {
  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) throw new OrgAccessError('Business not found', 404);
  if (business.ownerId === userId) return business;

  const member = await db.businessMember.findFirst({
    where: { businessId, userId, role: { in: [...PAY_ROLES] } },
  });
  if (!member) throw new OrgAccessError('Not authorized to pay from this business');
  return business;
}

/** Owner or business member with payroll/admin role. */
export async function requireBusinessAdmin(userId, businessId, db = prisma) {
  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) throw new OrgAccessError('Business not found', 404);
  if (business.ownerId === userId) return business;

  const member = await db.businessMember.findFirst({
    where: { businessId, userId, role: { in: [...ADMIN_ROLES] } },
  });
  if (!member) throw new OrgAccessError('Not authorized for this business');
  return business;
}

/** Any active member or owner. */
export async function requireBusinessMember(userId, businessId, db = prisma) {
  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) throw new OrgAccessError('Business not found', 404);
  if (business.ownerId === userId) return business;

  const member = await db.businessMember.findFirst({ where: { businessId, userId } });
  if (!member) throw new OrgAccessError('Not a member of this business');
  return business;
}

export function handleOrgAccessError(res, error) {
  if (error instanceof OrgAccessError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}
