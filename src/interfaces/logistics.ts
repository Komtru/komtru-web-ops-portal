/**
 * Logistics Module (M2) — Frontend Interfaces (Spec §3, §5a, §9)
 */

export type LogisticsCompanyStatus = 'ENABLED' | 'DISABLED';

export interface LogisticsCompany {
  id: string;
  name: string;
  status: LogisticsCompanyStatus;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type LogisticsMemberRole = 'ADMIN' | 'OPERATOR';
export type LogisticsMemberStatus = 'INVITED' | 'ACTIVE' | 'REMOVED';

export interface LogisticsCompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: LogisticsMemberRole;
  status: LogisticsMemberStatus;
  invitedByUserId: string | null;
  invitedAt: string | null;
  acceptedAt: string | null;
  removedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardCompanyPayload {
  name: string;
  initialPoc: {
    email?: string;
    phone?: string;
  };
}

export interface OnboardCompanyResponse {
  company: LogisticsCompany;
  poc: {
    outcome: 'LINKED' | 'PENDING';
    member?: LogisticsCompanyMember;
    invitation?: {
      id: string;
      companyId: string;
      role: LogisticsMemberRole;
      status: string;
      destinationMasked: string;
      channel: 'EMAIL' | 'PHONE';
      expiresAt: string;
    };
  };
}

export interface UpdateCompanyPayload {
  name?: string;
  status?: LogisticsCompanyStatus;
}

export type LogisticsPackageStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PICKED_UP'
  | 'PACKAGED'
  | 'SHIPPED'
  | 'DELIVERED';

export interface LogisticsPackage {
  id: string;
  tradeId: string;
  companyId: string;
  status: LogisticsPackageStatus;
  trackingNumber: string | null;
  rejectionReason: string | null;
  requestedAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  pickedUpAt: string | null;
  packagedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LogisticsStatusEvent {
  id: string;
  packageId: string;
  fromStatus: LogisticsPackageStatus | null;
  toStatus: LogisticsPackageStatus;
  actorUserId: string | null;
  note: string | null;
  createdAt: string;
}

export interface LogisticsPackageDetail extends LogisticsPackage {
  events: LogisticsStatusEvent[];
}

export interface ListCompaniesParams {
  page?: number;
  limit?: number;
  status?: LogisticsCompanyStatus;
}

export interface ListPackagesParams {
  page?: number;
  limit?: number;
  status?: LogisticsPackageStatus;
  companyId?: string;
  tradeId?: string;
}

export interface PaginatedCompaniesResponse {
  companies: LogisticsCompany[];
  total: number;
  page?: number;
  limit?: number;
}



export interface PaginatedPackagesResponse {
  packages: LogisticsPackage[];
  total: number;
}

