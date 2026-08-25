'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, UserCog } from 'lucide-react';

import { GrantRoleDialog, RevokeRoleDialog } from '@/app/(dashboard)/directory/staff/[id]/RoleDialogs';
import { ActionLogTable } from '@/components/general/admin/action-log-table';
import { QueryState } from '@/components/general/query-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { roleName } from '@/config/roles';
import { formatDateTime } from '@/helpers/format';
import { useStaffDetail } from '@/services/staff.services';
import type { InvitationStatus } from '@/interfaces/staff';

interface StaffMemberDetailViewProps {
  userId: string;
}

function invitationStatusVariant(
  status: InvitationStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'CLAIMED') return 'default';
  if (status === 'CANCELLED' || status === 'EXPIRED') return 'destructive';
  return 'secondary';
}

export function StaffMemberDetailView({ userId }: StaffMemberDetailViewProps) {
  const { data, isLoading, error, refetch } = useStaffDetail(userId);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/directory/staff">
            <ArrowLeft className="size-3.5" aria-hidden />
            Staff Members
          </Link>
        </Button>

        <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()}>
          {data ? (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h1 className="flex items-center gap-2 text-xl font-semibold">
                  <UserCog className="text-muted-foreground size-[18px]" aria-hidden />
                  {data.displayName}
                </h1>
                <p className="text-muted-foreground font-mono text-[12px]">{data.publicId}</p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Badge variant={data.status === 'ACTIVE' ? 'default' : 'destructive'}>
                    {data.status}
                  </Badge>
                  {data.mfaEnrolled ? (
                    <Badge
                      variant="outline"
                      className="border-komtru-success/40 text-komtru-success gap-1"
                    >
                      <ShieldCheck className="size-3" aria-hidden />
                      MFA enrolled
                    </Badge>
                  ) : (
                    <Badge variant="outline">MFA not enrolled</Badge>
                  )}
                </div>
              </div>
              <GrantRoleDialog
                userId={data.userId}
                heldRoleCodes={data.roles.map((role) => role.roleCode)}
              />
            </div>
          ) : null}
        </QueryState>
      </div>

      {data ? (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Roles</h2>
            <div className="border-border overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Granted</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.roles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground text-center text-[12.5px]">
                          No live role assignments.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.roles.map((role) => (
                        <TableRow key={role.roleCode}>
                          <TableCell className="font-medium">{roleName(role.roleCode)}</TableCell>
                          <TableCell className="text-muted-foreground text-[12px]">
                            {formatDateTime(role.grantedAt)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-[12px]">
                            {role.expiresAt ? formatDateTime(role.expiresAt) : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <RevokeRoleDialog
                              userId={data.userId}
                              roleCode={role.roleCode}
                              roleLabel={roleName(role.roleCode)}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Invite history</h2>
            <div className="border-border overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.inviteHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground text-center text-[12.5px]">
                          No invitations on record for this account.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.inviteHistory.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell>{invitation.roleName}</TableCell>
                          <TableCell>
                            <Badge
                              variant={invitationStatusVariant(invitation.status)}
                              className="text-[10.5px]"
                            >
                              {invitation.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-[12px]">
                            {formatDateTime(invitation.lastSentAt)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-[12px]">
                            {formatDateTime(invitation.expiresAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Recent admin actions</h2>
            <ActionLogTable entries={data.recentActions} hideAdminColumn />
          </section>
        </>
      ) : null}
    </div>
  );
}
