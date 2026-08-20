import { useQuery } from '@tanstack/react-query';

import type { IResponse } from '@/interfaces/IAxios';
import type { IOrganization } from '@/interfaces/organization';
import { http } from '@/services/base';

/**
 * The tenant behind the current session.
 *
 * This is also the reference implementation of the service pattern every module
 * follows: structured exported query keys, one hook per call, `queryFn` calling
 * `http.*`, and no component ever importing `http` directly.
 */
export const organizationKeys = {
  all: ['organization'] as const,
  current: () => [...organizationKeys.all, 'current'] as const,
};

export function useCurrentOrganization(options?: { enabled?: boolean }) {
  return useQuery<IOrganization>({
    queryKey: organizationKeys.current(),
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await http.get<IResponse<IOrganization>>({ url: 'organizations/current' });
      return response.data;
    },
  });
}
