/**
 * Types for M14's account-manager assignment surface.
 *
 * The backend contract here is being built in parallel by another engineer,
 * in `backend-apis` on the same branch (`feat/m14-account-managers`) — this
 * file was written against the DOCUMENTED contract only, not against real
 * code:
 *
 *  - `GET /admin/account-managers` — active account managers with their
 *    current customer counts. Modelled as a bare array, the same shape
 *    `useRoleRoster` reads off `GET /admin/roles` — both are "the live
 *    roster", not a paginated search.
 *  - The batched "which AM does each of these customers have" read has NO
 *    documented request/response shape at all — the spec explicitly leaves
 *    it TBD. `CustomerAccountManagerAssignment` and the request body below
 *    are this app's best guess, built to be easy to correct once the real
 *    contract lands: see the long comment on `useCustomerAccountManagers` in
 *    `services/accountManagers.services.ts`.
 *  - `POST /admin/customers/:userId/account-manager` and
 *    `POST /admin/account-managers/:staffId/offboard` are given verbatim in
 *    the spec, including their body shapes.
 */

export interface AccountManagerSummary {
  /** The staff member's userId — named `staffId` to match the offboard route's `:staffId` param. */
  staffId: string;
  displayName: string;
  email: string;
  /** How many customers this account manager currently has assigned. */
  customerCount: number;
}

/**
 * GUESSED shape — see the file-level comment. One entry per customer asked
 * about; a customer with no assignment yet comes back with a null AM rather
 * than being omitted, so a 1:1 zip against the requested `userIds` is safe.
 */
export interface CustomerAccountManagerAssignment {
  userId: string;
  accountManagerId: string | null;
  accountManagerDisplayName: string | null;
}

export interface AssignAccountManagerPayload {
  accountManagerId: string;
}

export interface OffboardAccountManagerPayload {
  /** Omit to auto-redistribute; set to bulk-move every customer to one replacement. */
  replacementAccountManagerId?: string;
}
