/**
 * Types for M14's staff-management surface (`/admin/staff`, `/admin/roles`,
 * `/admin/action-log`, `/admin/impersonation`).
 *
 * There is no separate "staff account" identity space on the backend: these
 * are ordinary `identity.users` rows that happen to hold at least one LIVE
 * role assignment. The shapes below mirror the backend's response bodies
 * exactly (see `backend-apis/src/modules/administration`), not a UI-invented
 * simplification of them.
 */

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'PENDING' | string;

export type InvitationStatus = 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';

/** A page shape used across M14's list endpoints: staff, invitations. */
export interface AdminPage<T> {
  results: T[];
  page: number;
  limit: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Staff roster / list / detail
// ---------------------------------------------------------------------------

export interface StaffAccountSummary {
  userId: string;
  publicId: string;
  displayName: string;
  username: string | null;
  email: string;
  status: UserStatus;
  mfaEnrolled: boolean;
  roleCodes: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface StaffRoleAssignment {
  roleCode: string;
  grantedAt: string;
  expiresAt: string | null;
  grantedByUserId: string;
}

export interface StaffInvitationView {
  id: string;
  email: string;
  roleCode: string;
  roleName: string;
  displayName: string | null;
  status: InvitationStatus;
  reason: string;
  invitedByUserId: string;
  approvedByUserId: string | null;
  sendCount: number;
  lastSentAt: string;
  expiresAt: string;
  createdAt: string;
  acceptedByUserId: string | null;
  acceptedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
}

export interface AdminActionLogEntry {
  id: string;
  occurredAt: string;
  adminUserId: string;
  actionCode: string;
  targetType: string;
  targetId: string | null;
  sourceModule: string;
  permissionCode: string | null;
  isImpersonation: boolean;
  impersonationSessionId: string | null;
  ip: string | null;
  detail: Record<string, unknown>;
}

export interface StaffMemberDetail {
  userId: string;
  publicId: string;
  displayName: string;
  username: string | null;
  status: UserStatus;
  mfaEnrolled: boolean;
  roles: StaffRoleAssignment[];
  inviteHistory: StaffInvitationView[];
  recentActions: AdminActionLogEntry[];
}

// ---------------------------------------------------------------------------
// Roster — "who currently holds which role, across the platform right now"
// ---------------------------------------------------------------------------

export interface ActiveRoleAssignmentSummary {
  assignmentId: string;
  userId: string;
  publicId: string;
  displayName: string;
  username: string | null;
  roleCode: string;
  roleName: string;
  requiresDualApproval: boolean;
  grantedAt: string;
  expiresAt: string | null;
  grantedByUserId: string;
  grantedByDisplayName: string;
}

// ---------------------------------------------------------------------------
// Request payloads
// ---------------------------------------------------------------------------

export interface ListStaffParams {
  q?: string;
  roleCode?: string;
  page?: number;
  limit?: number;
}

export interface ListStaffInvitationsParams {
  status?: InvitationStatus;
  roleCode?: string;
  page?: number;
  limit?: number;
}

export interface ListActionLogParams {
  adminUserId?: string;
  targetType?: string;
  targetId?: string;
  sourceModule?: string;
  actionCode?: string;
  isImpersonation?: boolean;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface CreateStaffInvitationPayload {
  email: string;
  roleCode: string;
  reason: string;
  displayName?: string;
  approvedBy?: string;
  expiresAt?: string;
}

export interface CancelStaffInvitationPayload {
  reason: string;
}

export interface GrantStaffRolePayload {
  roleCode: string;
  reason: string;
  expiresAt?: string;
  approvedBy?: string;
}

export interface RevokeStaffRolePayload {
  reason: string;
}

export interface GrantStaffRoleResult {
  roleCode: string;
  grantedAt: string;
  expiresAt: string | null;
}
