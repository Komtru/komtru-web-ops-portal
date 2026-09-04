import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  ListCompaniesParams,
  ListPackagesParams,
  LogisticsCompany,
  LogisticsCompanyMember,
  LogisticsPackage,
  LogisticsPackageDetail,
  OnboardCompanyPayload,
  OnboardCompanyResponse,
  PaginatedCompaniesResponse,
  PaginatedPackagesResponse,
  UpdateCompanyPayload,
} from '@/interfaces/logistics';
import type { IResponse } from '@/interfaces/IAxios';
import { http } from '@/services/base';

/**
 * Logistics Module (M2) — Admin Logistics Services (Spec §5a, §9)
 *
 * Interacts with:
 *   GET /api/admin/logistics/companies
 *   POST /api/admin/logistics/companies
 *   PATCH /api/admin/logistics/companies/:id
 *   GET /api/admin/logistics/companies/:id/members
 *   GET /api/admin/logistics/packages
 *   GET /api/admin/logistics/packages/:id
 */

export const logisticsKeys = {
  all: ['logistics'] as const,
  companies: (params?: ListCompaniesParams) => [...logisticsKeys.all, 'companies', params] as const,
  companyMembers: (companyId: string) => [...logisticsKeys.all, 'companies', companyId, 'members'] as const,
  packages: (params?: ListPackagesParams) => [...logisticsKeys.all, 'packages', params] as const,
  packageDetail: (packageId: string) => [...logisticsKeys.all, 'packages', packageId] as const,
};

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

export function useLogisticsCompanies(params: ListCompaniesParams = {}) {
  return useQuery<PaginatedCompaniesResponse>({
    queryKey: logisticsKeys.companies(params),
    queryFn: async () => {
      const response = await http.get<IResponse<PaginatedCompaniesResponse>>({

        url: 'admin/logistics/companies',
        query: {
          page: params.page,
          limit: params.limit,
          status: params.status,
        },
      });
      return response.data;
    },
  });
}

export function useOnboardLogisticsCompany() {
  const queryClient = useQueryClient();

  return useMutation<OnboardCompanyResponse, unknown, OnboardCompanyPayload>({
    mutationFn: async (payload) => {
      const response = await http.post<IResponse<OnboardCompanyResponse>>({
        url: 'admin/logistics/companies',
        body: payload,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
    },
  });
}

export function useUpdateLogisticsCompany() {
  const queryClient = useQueryClient();

  return useMutation<LogisticsCompany, unknown, { id: string; payload: UpdateCompanyPayload }>({
    mutationFn: async ({ id, payload }) => {
      const response = await http.patch<IResponse<LogisticsCompany>>({
        url: `admin/logistics/companies/${id}`,
        body: payload,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
    },
  });
}

export function useLogisticsCompanyMembers(companyId?: string) {
  return useQuery<{ members: LogisticsCompanyMember[] }>({
    queryKey: logisticsKeys.companyMembers(companyId ?? ''),
    queryFn: async () => {
      if (!companyId) return { members: [] };
      const response = await http.get<IResponse<{ members: LogisticsCompanyMember[] }>>({
        url: `admin/logistics/companies/${companyId}/members`,
      });
      return response.data;
    },
    enabled: Boolean(companyId),
  });
}

// ---------------------------------------------------------------------------
// Packages (Monitoring)
// ---------------------------------------------------------------------------

export function useLogisticsPackages(params: ListPackagesParams = {}) {
  return useQuery<PaginatedPackagesResponse>({
    queryKey: logisticsKeys.packages(params),
    queryFn: async () => {
      const response = await http.get<IResponse<PaginatedPackagesResponse>>({
        url: 'admin/logistics/packages',
        query: {
          page: params.page,
          limit: params.limit,
          status: params.status,
          companyId: params.companyId,
          tradeId: params.tradeId,
        },
      });
      return response.data;
    },
  });
}


export function useLogisticsPackageDetail(packageId?: string) {
  return useQuery<LogisticsPackageDetail>({
    queryKey: logisticsKeys.packageDetail(packageId ?? ''),
    queryFn: async () => {
      if (!packageId) throw new Error('Package ID is required');
      const response = await http.get<IResponse<LogisticsPackageDetail>>({
        url: `admin/logistics/packages/${packageId}`,
      });
      return response.data;
    },
    enabled: Boolean(packageId),
  });
}
