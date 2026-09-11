import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  AccountManagerSummary,
  AssignAccountManagerPayload,
  CustomerAccountManagerAssignment,
  OffboardAccountManagerPayload,
} from '@/interfaces/accountManager';
import type { IResponse, RequestError } from '@/interfaces/IAxios';
import { customerKeys } from '@/services/customers.services';
import { http } from '@/services/base';

/**
 * Account-manager assignment (M14). The backend half of this contract is
 * being built in parallel, on `backend-apis`'s `feat/m14-account-managers` —
 * this file was written against the DESCRIBED contract, not against real
 * code, so read the comment on each hook before trusting its request shape.
 *
 * Same structured-query-key pattern as every other `*.services.ts` file.
 */
export const accountManagerKeys = {
  all: ['account-managers'] as const,
  list: () => [...accountManagerKeys.all, 'list'] as const,
  batch: (userIds: string[]) =>
    [...accountManagerKeys.all, 'batch', [...userIds].sort()] as const,
};

/**
 * `GET /admin/account-managers` — active account managers with their current
 * customer counts.
 *
 * Modelled as a bare array rather than an `AdminPage<...>`, the same choice
 * `useRoleRoster` makes for `GET /admin/roles`: this is "the live roster of
 * active AMs", a small, un-paginated set, not a search endpoint.
 */
export function useAccountManagerList() {
  return useQuery<AccountManagerSummary[]>({
    queryKey: accountManagerKeys.list(),
    queryFn: async () => {
      const response = await http.get<
        IResponse<AccountManagerSummary[] | { results: AccountManagerSummary[] }>
      >({
        url: 'admin/account-managers',
      });
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data?.results ?? [];
    },
  });
}

/**
 * Batched "which account manager does each of these customers have" read.
 *
 * **This request/response shape is a GUESS.** The spec is explicit that the
 * backend bot's query shape for this is TBD — there is nothing to read. This
 * hook picks the most defensible shape given the rest of the contract:
 *
 *  - `POST` rather than `GET` with a `userIds` query array, because every
 *    other multi-id-ish read in this codebase (`admin/roles`, `admin/staff`)
 *    takes simple scalar filters, not arrays, over query strings — and a
 *    batch of up to `PAGE_SIZE` (25) ids is a body, not a URL, once you also
 *    want room to grow.
 *  - `admin/customers/account-managers/batch`, alongside the spec's own
 *    `POST /admin/customers/:userId/account-manager` singular-assign route
 *    and `GET /admin/account-managers` roster route.
 *  - Response `{ assignments: [...] }`, one entry per requested id (a
 *    customer with no AM yet still gets an entry, with a null AM) so the
 *    Customers list can zip results back onto rows without guessing at
 *    omission.
 *
 * If the real endpoint turns out to answer a different shape once the
 * backend branch merges, this is the one place to fix — every caller reads
 * through `useCustomerAccountManagers`, never `http` directly. The Customers
 * list also treats this query's failure as non-fatal (see `CustomersView`):
 * a wrong guess here degrades the "assigned AM" column, it does not break
 * the customer list itself.
 */
export function useCustomerAccountManagers(userIds: string[]) {
  return useQuery<CustomerAccountManagerAssignment[]>({
    queryKey: accountManagerKeys.batch(userIds),
    enabled: userIds.length > 0,
    queryFn: async () => {
      const response = await http.post<IResponse<{ assignments: CustomerAccountManagerAssignment[] }>>(
        {
          url: 'admin/customers/account-managers/batch',
          body: { userIds },
        },
      );
      return response.data.assignments;
    },
  });
}

/** `POST /admin/customers/:userId/account-manager` — manual (re)assign one customer. */
export function useAssignAccountManager() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    RequestError,
    { userId: string } & AssignAccountManagerPayload
  >({
    mutationKey: [...accountManagerKeys.all, 'assign'],
    mutationFn: async ({ userId, ...body }) =>
      http.post<void>({
        url: `admin/customers/${userId}/account-manager`,
        body,
      }),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.userId) });
      // Prefix match: also catches every in-flight batch AM lookup, each
      // keyed on its own id list, plus the AM roster's customer counts.
      void queryClient.invalidateQueries({ queryKey: accountManagerKeys.all });
    },
  });
}

/**
 * `POST /admin/account-managers/:staffId/offboard` — omit
 * `replacementAccountManagerId` to auto-redistribute, include it to bulk-move
 * every customer to that replacement.
 *
 * Deliberately does NOT touch the `ACCOUNT_MANAGER` role itself — per the
 * spec, that stays identity's existing `useRevokeStaffRole`. Callers that
 * need "offboard, then revoke the role" (the Staff-directory interception)
 * sequence the two mutations themselves; see
 * `AccountManagerOffboardDialog.tsx`.
 */
export function useOffboardAccountManager() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    RequestError,
    { staffId: string } & OffboardAccountManagerPayload
  >({
    mutationKey: [...accountManagerKeys.all, 'offboard'],
    mutationFn: async ({ staffId, replacementAccountManagerId }) =>
      http.post<void>({
        url: `admin/account-managers/${staffId}/offboard`,
        body: replacementAccountManagerId ? { replacementAccountManagerId } : {},
      }),
    onSuccess: () => {
      // Prefix match: catches the roster (counts changed) and every
      // in-flight batch AM lookup (assignments may have moved).
      void queryClient.invalidateQueries({ queryKey: accountManagerKeys.all });
    },
  });
}
