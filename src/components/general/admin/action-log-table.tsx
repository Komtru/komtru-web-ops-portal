'use client';

import { UserRoundCog } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AdminActionLogEntry } from '@/interfaces/staff';
import { formatDateTime } from '@/helpers/format';

interface ActionLogTableProps {
  entries: AdminActionLogEntry[];
  /** Hide the "Admin" column on a page already scoped to one admin. */
  hideAdminColumn?: boolean;
}

/**
 * Presentational table for `admin_action_log` rows. Used both by the
 * platform-wide "Action Log" tab on the Staff Members list, and by a staff
 * member's own "Recent actions" panel — deliberately the same simple shape
 * in both places rather than two bespoke renderings.
 *
 * Kept intentionally thin: M15 (Audit & Compliance) owns the dedicated
 * audit-trail experience (exports, saved views, retention). This is a
 * read-only, filterable list — nothing more.
 */
export function ActionLogTable({ entries, hideAdminColumn = false }: ActionLogTableProps) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Occurred</TableHead>
              {hideAdminColumn ? null : <TableHead>Admin</TableHead>}
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Permission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap text-[12px]">
                  {formatDateTime(entry.occurredAt)}
                </TableCell>
                {hideAdminColumn ? null : (
                  <TableCell className="font-mono text-[11.5px]">
                    {entry.adminUserId.slice(0, 8)}…
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12.5px] font-medium">{entry.actionCode}</span>
                    {entry.isImpersonation ? (
                      <Badge
                        variant="outline"
                        className="border-komtru-warning/40 text-komtru-warning gap-1 text-[10px]"
                      >
                        <UserRoundCog className="size-3" aria-hidden />
                        Impersonation
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-[12px]">
                  {entry.targetType}
                  {entry.targetId ? (
                    <span className="font-mono"> · {entry.targetId.slice(0, 8)}…</span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10.5px]">
                    {entry.sourceModule}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-[12px]">
                  {entry.permissionCode ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
