/**
 * Role catalog for the staff-management screens (invite / grant pickers,
 * role-name display).
 *
 * There is no HTTP endpoint that serves this — `GET /admin/roles` returns
 * the live roster of who *holds* a role right now, not the fixed catalog of
 * role definitions, and M14 deliberately does not stand up a second read
 * path duplicating identity's own role list. So this mirrors
 * `backend-apis/src/modules/identity/domain/rbac/catalog.ts`'s `ROLES` and
 * `INVITABLE_ROLE_CODES` — a small, rarely-changing, effectively-enum set.
 * Keep the two in sync if a role is ever added, renamed or retired.
 */

export interface RoleOption {
  code: string;
  name: string;
  description: string;
  requiresDualApproval: boolean;
}

export const STAFF_ROLES: readonly RoleOption[] = [
  {
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Break-glass access. Two people maximum.',
    requiresDualApproval: true,
  },
  {
    code: 'OPERATIONS_ADMIN',
    name: 'Operations Admin',
    description: 'Day-to-day transaction and user operations.',
    requiresDualApproval: false,
  },
  {
    code: 'FINANCE_ADMIN',
    name: 'Finance Admin',
    description: 'Refunds, settlement and reconciliation.',
    requiresDualApproval: true,
  },
  {
    code: 'COMPLIANCE_OFFICER',
    name: 'Compliance Officer',
    description: 'Regulatory obligations, reporting, erasure approval.',
    requiresDualApproval: true,
  },
  {
    code: 'FRAUD_ANALYST',
    name: 'Fraud Analyst',
    description: 'Investigation, restriction, device graph.',
    requiresDualApproval: false,
  },
  {
    code: 'KYC_ANALYST',
    name: 'KYC Analyst',
    description: 'Verification review.',
    requiresDualApproval: false,
  },
  {
    code: 'DISPUTE_REVIEWER',
    name: 'Dispute Reviewer',
    description: 'Dispute decisions.',
    requiresDualApproval: false,
  },
  {
    code: 'SUPPORT_AGENT',
    name: 'Support Agent',
    description: 'Tickets and a limited user view. PII masked by default.',
    requiresDualApproval: false,
  },
  {
    code: 'SUPPORT_LEAD',
    name: 'Support Lead',
    description: 'Support, escalation and reassignment.',
    requiresDualApproval: false,
  },
  {
    code: 'ACCOUNT_MANAGER',
    name: 'Account Manager',
    description: 'Owns a book of customer accounts — the assigned point of contact for support and outreach.',
    requiresDualApproval: false,
  },
  {
    code: 'LOGISTICS_OPERATOR',
    name: 'Logistics Operator',
    description: 'Shipment exceptions.',
    requiresDualApproval: false,
  },
  {
    code: 'ANALYST',
    name: 'Analyst',
    description: 'Read-only analytics, no PII.',
    requiresDualApproval: false,
  },
  {
    code: 'READ_ONLY',
    name: 'Read Only',
    description: 'Audit and observer access.',
    requiresDualApproval: false,
  },
];

/** Every role except SUPER_ADMIN — same rule as identity's `INVITABLE_ROLE_CODES`. */
export const INVITABLE_STAFF_ROLES: readonly RoleOption[] = STAFF_ROLES.filter(
  (role) => role.code !== 'SUPER_ADMIN',
);

export function roleName(roleCode: string): string {
  return STAFF_ROLES.find((role) => role.code === roleCode)?.name ?? roleCode;
}
