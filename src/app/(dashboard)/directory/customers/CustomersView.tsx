'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';

import { AssignAccountManagerDialog } from '@/app/(dashboard)/directory/customers/AssignAccountManagerDialog';
import { QueryState } from '@/components/general/query-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime, formatEnum } from '@/helpers/format';
import type { CustomerAccountStatus, CustomerVerificationLevel } from '@/interfaces/customer';
import { useCustomerAccountManagers } from '@/services/accountManagers.services';
import { useCustomerList } from '@/services/customers.services';

const ALL = '__all__';
const PAGE_SIZE = 25;

const STATUS_OPTIONS: CustomerAccountStatus[] = [
  'PENDING_VERIFICATION',
  'ACTIVE',
  'RESTRICTED',
  'SUSPENDED',
  'LOCKED',
  'CLOSED',
  'ANONYMISED',
];

const VERIFICATION_OPTIONS: CustomerVerificationLevel[] = [
  'UNVERIFIED',
  'CONTACT_VERIFIED',
  'IDENTITY_VERIFIED',
  'BUSINESS_VERIFIED',
  'ENHANCED',
];

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'ACTIVE') return 'default';
  if (status === 'SUSPENDED' || status === 'LOCKED' || status === 'CLOSED') return 'destructive';
  if (status === 'RESTRICTED') return 'outline';
  return 'secondary';
}

function verificationVariant(level: string): 'default' | 'secondary' | 'outline' {
  if (level === 'IDENTITY_VERIFIED' || level === 'BUSINESS_VERIFIED' || level === 'ENHANCED') {
    return 'default';
  }
  if (level === 'CONTACT_VERIFIED') return 'secondary';
  return 'outline';
}

/**
 * The Customers directory — consumer-account lookup, not staff.
 *
 * Follows `StaffMembersView`'s conventions: search + filters, a paginated
 * table, and a detail-by-id route (`/directory/customers/[id]`) rather than
 * a drawer, for consistency with `StaffMemberDetailView`.
 */
export function CustomersView() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(ALL);
  const [verificationLevel, setVerificationLevel] = useState(ALL);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useCustomerList({
    q: q.trim() || undefined,
    status: status === ALL ? undefined : (status as CustomerAccountStatus),
    verificationLevel: verificationLevel === ALL ? undefined : (verificationLevel as CustomerVerificationLevel),
    page,
    limit: PAGE_SIZE,
  });

  const customerIds = (data?.results ?? []).map((customer) => customer.id);
  // Best-effort enrichment — see the long comment on this hook. A failure here
  // degrades the Account Manager column, it never blocks the customer list.
  const accountManagers = useCustomerAccountManagers(customerIds);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Users className="text-muted-foreground size-[18px]" aria-hidden />
          Customers
        </h1>
        <p className="text-muted-foreground max-w-2xl text-[12.5px] leading-relaxed">
          Every consumer account on the platform — buyers and sellers. Open a record for its full
          identity, verification and account-manager assignment.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by handle or public ID"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {formatEnum(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={verificationLevel}
          onValueChange={(value) => {
            setVerificationLevel(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="All verification levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All verification levels</SelectItem>
            {VERIFICATION_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {formatEnum(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={!isLoading && !error && (data?.results.length ?? 0) === 0}
        onRetry={() => void refetch()}
        emptyTitle="No customers match"
        emptyDescription="Adjust the search or filters."
      >
        <div className="border-border overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / handle</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Account manager</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.results ?? []).map((customer) => {
                  const assignment = accountManagers.data?.find((row) => row.userId === customer.id);

                  return (
                    <TableRow key={customer.id} className="hover:bg-muted/40">
                      <TableCell>
                        <Link
                          href={`/directory/customers/${customer.id}`}
                          className="hover:text-komtru-blue font-medium underline-offset-2 hover:underline"
                        >
                          {customer.displayName ?? customer.username ?? customer.publicId}
                        </Link>
                        <p className="text-muted-foreground font-mono text-[11px]">
                          {customer.publicId}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={verificationVariant(customer.verificationLevel)} className="text-[10.5px]">
                          {formatEnum(customer.verificationLevel)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(customer.status)} className="text-[10.5px]">
                          {formatEnum(customer.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[12px]">
                        {formatDateTime(customer.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {accountManagers.isLoading ? (
                            <span className="text-muted-foreground text-[11.5px]">Loading…</span>
                          ) : accountManagers.isError ? (
                            <span className="text-muted-foreground text-[11.5px]">—</span>
                          ) : assignment?.accountManagerDisplayName ? (
                            <span className="text-[12.5px]">{assignment.accountManagerDisplayName}</span>
                          ) : (
                            <span className="text-muted-foreground text-[11.5px]">Unassigned</span>
                          )}
                          <AssignAccountManagerDialog
                            userId={customer.id}
                            currentAccountManagerId={assignment?.accountManagerId}
                            currentAccountManagerName={assignment?.accountManagerDisplayName}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {data && data.total > data.limit ? (
          <div className="flex items-center justify-between pt-1">
            <p className="text-muted-foreground text-[12px]">
              Page {data.page} of {totalPages} · {data.total} customer
              {data.total === 1 ? '' : 's'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </QueryState>
    </div>
  );
}
