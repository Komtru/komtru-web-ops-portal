/**
 * Types for the Customers directory — consumer accounts (buyers/sellers), not
 * staff. Backed by identity's own `/admin/users` endpoints (`user.search` for
 * the list, `user.view` for detail) — a DIFFERENT mount from M14's
 * `/admin/staff` (see `src/interfaces/staff.ts`), because a customer is not
 * "a `users` row with a live role assignment", it's just a `users` row.
 *
 * Shapes below mirror `backend-apis/src/modules/identity/http/admin.controller.ts`
 * (`listUsersController` / `getUserController`) exactly, confirmed by reading
 * the route file directly — not a UI-invented simplification.
 */

export type CustomerAccountStatus =
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'RESTRICTED'
  | 'SUSPENDED'
  | 'LOCKED'
  | 'CLOSED'
  | 'ANONYMISED'
  | (string & {});

export type CustomerVerificationLevel =
  | 'UNVERIFIED'
  | 'CONTACT_VERIFIED'
  | 'IDENTITY_VERIFIED'
  | 'BUSINESS_VERIFIED'
  | 'ENHANCED'
  | (string & {});

/**
 * One row of `GET /admin/users`.
 *
 * Keyed on `id`, NOT `userId` — that is genuinely what `listUsersController`'s
 * `db.select({ id: users.id, ... })` returns. `getUserController` (the detail
 * endpoint below) answers `userId` instead; this is a real inconsistency in
 * the backend response shapes, not a typo here.
 */
export interface CustomerListItem {
  id: string;
  publicId: string;
  username: string | null;
  displayName: string | null;
  status: CustomerAccountStatus;
  verificationLevel: CustomerVerificationLevel;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface ListCustomersParams {
  /** Matches against username / publicId only — never email (see backend comment on enumeration risk). */
  q?: string;
  status?: CustomerAccountStatus;
  verificationLevel?: CustomerVerificationLevel;
  page?: number;
  limit?: number;
}

export interface CustomerContactChannel {
  id: string;
  /** Always masked — full contact detail is a separate, audited PII endpoint this screen does not call. */
  masked: string;
  verified: boolean;
}

export interface CustomerRoleAssignment {
  roleCode: string;
  grantedAt: string;
  expiresAt: string | null;
}

export interface CustomerCapability {
  capability: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'REVOKED' | (string & {});
  activatedAt: string | null;
}

/** `GET /admin/users/:id` — the non-PII view. Contact channels appear masked, and only masked. */
export interface CustomerDetail {
  userId: string;
  publicId: string;
  username: string | null;
  status: CustomerAccountStatus;
  statusReason: string | null;
  verificationLevel: CustomerVerificationLevel;
  displayName: string | null;
  emails: CustomerContactChannel[];
  phones: CustomerContactChannel[];
  roles: CustomerRoleAssignment[];
  capabilities: CustomerCapability[];
  mfaRequired: boolean;
  mfaEnrolledAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  sessionsEpoch: number;
}
