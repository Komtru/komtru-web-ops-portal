'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Users } from 'lucide-react';

import { AssignAccountManagerDialog } from '@/app/(dashboard)/directory/customers/AssignAccountManagerDialog';
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
import { formatDateTime, formatEnum } from '@/helpers/format';
import { useCustomerAccountManagers } from '@/services/accountManagers.services';
import { useCustomerDetail } from '@/services/customers.services';

interface CustomerDetailViewProps {
  userId: string;
}

export function CustomerDetailView({ userId }: CustomerDetailViewProps) {
  const { data, isLoading, error, refetch } = useCustomerDetail(userId);
  // A batch of one — the same hook the list uses, so the two never drift.
  const accountManagers = useCustomerAccountManagers(data ? [userId] : []);
  const assignment = accountManagers.data?.[0];

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/directory/customers">
            <ArrowLeft className="size-3.5" aria-hidden />
            Customers
          </Link>
        </Button>

        <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()}>
          {data ? (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h1 className="flex items-center gap-2 text-xl font-semibold">
                  <Users className="text-muted-foreground size-[18px]" aria-hidden />
                  {data.displayName ?? data.username ?? data.publicId}
                </h1>
                <p className="text-muted-foreground font-mono text-[12px]">{data.publicId}</p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Badge variant={data.status === 'ACTIVE' ? 'default' : 'destructive'}>
                    {formatEnum(data.status)}
                  </Badge>
                  <Badge variant="outline">{formatEnum(data.verificationLevel)}</Badge>
                  {data.mfaEnrolledAt ? (
                    <Badge
                      variant="outline"
                      className="border-komtru-success/40 text-komtru-success gap-1"
                    >
                      <ShieldCheck className="size-3" aria-hidden />
                      MFA enrolled
                    </Badge>
                  ) : null}
                </div>
                {data.statusReason ? (
                  <p className="text-muted-foreground text-[12px]">{data.statusReason}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </QueryState>
      </div>

      {data ? (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Account manager</h2>
            <div className="border-border flex items-center justify-between gap-3 rounded-xl border p-3">
              {accountManagers.isLoading ? (
                <span className="text-muted-foreground text-[12.5px]">Loading…</span>
              ) : accountManagers.isError ? (
                <span className="text-muted-foreground text-[12.5px]">
                  Couldn&apos;t load the assignment for this customer.
                </span>
              ) : assignment?.accountManagerDisplayName ? (
                <span className="text-[13px]">{assignment.accountManagerDisplayName}</span>
              ) : (
                <span className="text-muted-foreground text-[12.5px]">No account manager assigned.</span>
              )}
              <AssignAccountManagerDialog
                userId={data.userId}
                currentAccountManagerId={assignment?.accountManagerId}
                currentAccountManagerName={assignment?.accountManagerDisplayName}
              />
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Identity</h2>
            <div className="border-border overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-muted-foreground w-40">Username</TableCell>
                      <TableCell>{data.username ?? '—'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">Joined</TableCell>
                      <TableCell>{formatDateTime(data.createdAt)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">Last login</TableCell>
                      <TableCell>{data.lastLoginAt ? formatDateTime(data.lastLoginAt) : 'Never'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Contact channels</h2>
            <div className="border-border overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Verified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...data.emails.map((e) => ({ ...e, kind: 'Email' })), ...data.phones.map((p) => ({ ...p, kind: 'Phone' }))].length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground text-center text-[12.5px]">
                          No contact channels on record.
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...data.emails.map((e) => ({ ...e, kind: 'Email' })), ...data.phones.map((p) => ({ ...p, kind: 'Phone' }))].map(
                        (channel) => (
                          <TableRow key={`${channel.kind}-${channel.id}`}>
                            <TableCell>{channel.kind}</TableCell>
                            <TableCell className="font-mono text-[12.5px]">{channel.masked}</TableCell>
                            <TableCell>
                              <Badge variant={channel.verified ? 'default' : 'outline'} className="text-[10.5px]">
                                {channel.verified ? 'Verified' : 'Unverified'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ),
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>

          {data.roles.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Staff roles</h2>
              <p className="text-muted-foreground text-[12px]">
                This account also holds a live staff role — manage it from{' '}
                <Link href={`/directory/staff/${data.userId}`} className="hover:text-komtru-blue underline-offset-2 hover:underline">
                  its staff record
                </Link>
                .
              </p>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
