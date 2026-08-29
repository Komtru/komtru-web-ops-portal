import { useQuery } from '@tanstack/react-query';

import type { AdminPage } from '@/interfaces/staff';
import type { CustomerDetail, CustomerListItem, ListCustomersParams } from '@/interfaces/customer';
import type { IResponse } from '@/interfaces/IAxios';
import { http } from '@/services/base';

/**
 * The Customers directory — consumer-account lookup, not staff. Wired to
 * identity's own `/admin/users` endpoints (`GET /admin/users`, permission
 * `user.search`; `GET /admin/users/:id`, permission `user.view`), confirmed
 * by reading `backend-apis/src/modules/identity/http/routes.ts` and
 * `admin.controller.ts` directly.
 *
 * Same pattern as `organization.services.ts` / `staff.services.ts`:
 * structured query keys, one hook per call, `queryFn` calling `http.*`.
 *
 * There is one real endpoint here, not two — `q` is just an optional filter
 * on the list call, there is no separate search route. `useCustomerList`
 * covers both "browse everyone" and "search for one" rather than standing up
 * a second hook that would call the exact same URL.
 */
export const customerKeys = {
  all: ['customers'] as const,
  list: (params: ListCustomersParams) => [...customerKeys.all, 'list', params] as const,
  detail: (userId: string) => [...customerKeys.all, 'detail', userId] as const,
};

export function useCustomerList(params: ListCustomersParams = {}) {
  return useQuery<AdminPage<CustomerListItem>>({
    queryKey: customerKeys.list(params),
    queryFn: async () => {
      const response = await http.get<IResponse<AdminPage<CustomerListItem>>>({
        url: 'admin/users',
        query: {
          q: params.q,
          status: params.status,
          verificationLevel: params.verificationLevel,
          page: params.page,
          limit: params.limit,
        },
      });
      return response.data;
    },
  });
}

export function useCustomerDetail(userId: string | undefined) {
  return useQuery<CustomerDetail>({
    queryKey: customerKeys.detail(userId ?? ''),
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await http.get<IResponse<CustomerDetail>>({
        url: `admin/users/${userId}`,
      });
      return response.data;
    },
  });
}
