import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  ActiveRoleAssignmentSummary,
  AdminActionLogEntry,
  AdminPage,
  CancelStaffInvitationPayload,
  CreateStaffInvitationPayload,
  GrantStaffRolePayload,
  GrantStaffRoleResult,
  ListActionLogParams,
  ListStaffInvitationsParams,
  ListStaffParams,
  RevokeStaffRolePayload,
  StaffAccountSummary,
  StaffInvitationView,
  StaffMemberDetail,
} from '@/interfaces/staff';
import type { IResponse, RequestError } from '@/interfaces/IAxios';
import { http } from '@/services/base';

/**
 * M14's staff-management surface: the roster of accounts holding a staff
 * role, per-account role grant/revoke, staff invitations, the cross-module
 * role roster, and the platform-wide admin action log.
 *
 * Follows `organization.services.ts`'s pattern: structured query keys, one
 * hook per call, `queryFn`/`mutationFn` calling `http.*`, nothing else ever
 * importing `http` directly.
 */
export const staffKeys = {
  all: ['staff'] as const,
  list: (params: ListStaffParams) => [...staffKeys.all, 'list', params] as const,
  detail: (userId: string) => [...staffKeys.all, 'detail', userId] as const,
  roster: (roleCode?: string) => [...staffKeys.all, 'roster', roleCode ?? null] as const,
  invitations: (params: ListStaffInvitationsParams) =>
    [...staffKeys.all, 'invitations', params] as const,
};

export const actionLogKeys = {
  all: ['action-log'] as const,
  list: (params: ListActionLogParams) => [...actionLogKeys.all, 'list', params] as const,
};

// ---------------------------------------------------------------------------
// Staff list / detail
// ---------------------------------------------------------------------------

export function useStaffList(params: ListStaffParams = {}) {
  return useQuery<AdminPage<StaffAccountSummary>>({
    queryKey: staffKeys.list(params),
    queryFn: async () => {
      const response = await http.get<IResponse<AdminPage<StaffAccountSummary>>>({
        url: 'admin/staff',
        query: { q: params.q, roleCode: params.roleCode, page: params.page, limit: params.limit },
      });
      return response.data;
    },
  });
}

export function useStaffDetail(userId: string | undefined) {
  return useQuery<StaffMemberDetail>({
    queryKey: staffKeys.detail(userId ?? ''),
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await http.get<IResponse<StaffMemberDetail>>({
        url: `admin/staff/${userId}`,
      });
      return response.data;
    },
  });
}

// ---------------------------------------------------------------------------
// Cross-module role roster — "who currently holds which role, right now"
// ---------------------------------------------------------------------------

export function useRoleRoster(roleCode?: string) {
  return useQuery<ActiveRoleAssignmentSummary[]>({
    queryKey: staffKeys.roster(roleCode),
    queryFn: async () => {
      const response = await http.get<IResponse<ActiveRoleAssignmentSummary[]>>({
        url: 'admin/roles',
        query: { roleCode },
      });
      return response.data;
    },
  });
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

export function useStaffInvitations(params: ListStaffInvitationsParams = {}) {
  return useQuery<AdminPage<StaffInvitationView>>({
    queryKey: staffKeys.invitations(params),
    queryFn: async () => {
      const response = await http.get<IResponse<AdminPage<StaffInvitationView>>>({
        url: 'admin/staff/invitations',
        query: {
          status: params.status,
          roleCode: params.roleCode,
          page: params.page,
          limit: params.limit,
        },
      });
      return response.data;
    },
  });
}

/**
 * Wired to identity's real `staffInvitation.service.ts` — this endpoint does
 * not reimplement invitation issuance, it thinly wraps it and mirrors the
 * result into `admin_action_log`.
 */
export function useInviteStaffMember() {
  const queryClient = useQueryClient();

  return useMutation<StaffInvitationView, RequestError, CreateStaffInvitationPayload>({
    mutationKey: [...staffKeys.all, 'invite'],
    mutationFn: async (body) => {
      const response = await http.post<IResponse<StaffInvitationView>>({
        url: 'admin/staff/invitations',
        body,
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}

export function useResendStaffInvitation() {
  const queryClient = useQueryClient();

  return useMutation<StaffInvitationView, RequestError, { invitationId: string }>({
    mutationKey: [...staffKeys.all, 'invite', 'resend'],
    mutationFn: async ({ invitationId }) => {
      const response = await http.post<IResponse<StaffInvitationView>>({
        url: `admin/staff/invitations/${invitationId}/resend`,
        body: {},
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}

export function useCancelStaffInvitation() {
  const queryClient = useQueryClient();

  return useMutation<
    StaffInvitationView,
    RequestError,
    { invitationId: string } & CancelStaffInvitationPayload
  >({
    mutationKey: [...staffKeys.all, 'invite', 'cancel'],
    mutationFn: async ({ invitationId, ...body }) => {
      const response = await http.post<IResponse<StaffInvitationView>>({
        url: `admin/staff/invitations/${invitationId}/cancel`,
        body,
      });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Grant / revoke
// ---------------------------------------------------------------------------

export function useGrantStaffRole() {
  const queryClient = useQueryClient();

  return useMutation<
    GrantStaffRoleResult,
    RequestError,
    { userId: string } & GrantStaffRolePayload
  >({
    mutationKey: [...staffKeys.all, 'grant-role'],
    mutationFn: async ({ userId, ...body }) => {
      const response = await http.post<IResponse<GrantStaffRoleResult>>({
        url: `admin/staff/${userId}/roles`,
        body,
      });
      return response.data;
    },
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
      void queryClient.invalidateQueries({ queryKey: staffKeys.detail(variables.userId) });
    },
  });
}

export function useRevokeStaffRole() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    RequestError,
    { userId: string; roleCode: string } & RevokeStaffRolePayload
  >({
    mutationKey: [...staffKeys.all, 'revoke-role'],
    mutationFn: async ({ userId, roleCode, ...body }) =>
      http.delete<void>({
        url: `admin/staff/${userId}/roles/${roleCode}`,
        body,
      }),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
      void queryClient.invalidateQueries({ queryKey: staffKeys.detail(variables.userId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Platform-wide admin action log — a simple filterable view. M15 (Audit &
// Compliance) owns the dedicated audit-trail experience; this is deliberately
// thin — one filtered table, no exports, no saved views.
// ---------------------------------------------------------------------------

export function useActionLog(params: ListActionLogParams = {}) {
  return useQuery<{ results: AdminActionLogEntry[]; total: number }>({
    queryKey: actionLogKeys.list(params),
    queryFn: async () => {
      const response = await http.get<IResponse<{ results: AdminActionLogEntry[]; total: number }>>({
        url: 'admin/action-log',
        query: {
          adminUserId: params.adminUserId,
          targetType: params.targetType,
          targetId: params.targetId,
          sourceModule: params.sourceModule,
          actionCode: params.actionCode,
          isImpersonation: params.isImpersonation,
          from: params.from,
          to: params.to,
          limit: params.limit,
          offset: params.offset,
        },
      });
      return response.data;
    },
  });
}
