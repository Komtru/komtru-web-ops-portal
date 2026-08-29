'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, UserCog } from 'lucide-react';

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
import { STAFF_ROLES, roleName } from '@/config/roles';
import { formatDateTime } from '@/helpers/format';
import { useStaffList } from '@/services/staff.services';

const ALL_ROLES = '__all__';
const PAGE_SIZE = 25;

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'ACTIVE') return 'default';
  if (status === 'SUSPENDED' || status === 'DEACTIVATED') return 'destructive';
  return 'secondary';
}

function StaffTable() {
  const [q, setQ] = useState('');
  const [roleCode, setRoleCode] = useState(ALL_ROLES);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useStaffList({
    q: q.trim() || undefined,
    roleCode: roleCode === ALL_ROLES ? undefined : roleCode,
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Search staff by name, email or handle"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={roleCode}
          onValueChange={(value) => {
            setRoleCode(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ROLES}>All roles</SelectItem>
            {STAFF_ROLES.map((role) => (
              <SelectItem key={role.code} value={role.code}>
                {role.name}
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
        emptyTitle="No staff accounts match"
        emptyDescription="Adjust the search or role filter, or invite someone new from Staff Invitations."
      >
        <div className="border-border overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>MFA</TableHead>
                  <TableHead>Last login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.results ?? []).map((staff) => (
                  <TableRow key={staff.userId} className="hover:bg-muted/40">
                    <TableCell>
                      <Link
                        href={`/directory/staff/${staff.userId}`}
                        className="hover:text-komtru-blue font-medium underline-offset-2 hover:underline"
                      >
                        {staff.displayName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[12.5px]">
                      {staff.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {staff.roleCodes.map((code) => (
                          <Badge key={code} variant="secondary" className="text-[10.5px]">
                            {roleName(code)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(staff.status)} className="text-[10.5px]">
                        {staff.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {staff.mfaEnrolled ? (
                        <ShieldCheck className="text-komtru-success size-4" aria-hidden />
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Not enrolled</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[12px]">
                      {staff.lastLoginAt ? formatDateTime(staff.lastLoginAt) : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {data && data.total > data.limit ? (
          <div className="flex items-center justify-between pt-1">
            <p className="text-muted-foreground text-[12px]">
              Page {data.page} of {totalPages} · {data.total} staff account
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

export function StaffMembersView() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <UserCog className="text-muted-foreground size-[18px]" aria-hidden />
          Staff Members
        </h1>
        <p className="text-muted-foreground max-w-2xl text-[12.5px] leading-relaxed">
          Everyone holding a staff role today. There is no separate staff identity — this is the
          same `users` table as buyers and sellers, filtered to accounts with a live role
          assignment.
        </p>
      </div>

      <StaffTable />
    </div>
  );
}
