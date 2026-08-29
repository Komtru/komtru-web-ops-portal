'use client';

import { useState } from 'react';
import { Send, X } from 'lucide-react';

import { QueryState, errorMessageOf } from '@/components/general/query-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/helpers/format';
import { useCustomToast } from '@/hooks/useCustomToast';
import type { InvitationStatus, StaffInvitationView } from '@/interfaces/staff';
import {
  useCancelStaffInvitation,
  useResendStaffInvitation,
  useRoleRoster,
  useStaffInvitations,
} from '@/services/staff.services';

const ALL = '__all__';
const STATUS_OPTIONS: InvitationStatus[] = ['PENDING', 'CLAIMED', 'EXPIRED', 'CANCELLED'];

function invitationStatusVariant(
  status: InvitationStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'CLAIMED') return 'default';
  if (status === 'CANCELLED' || status === 'EXPIRED') return 'destructive';
  return 'secondary';
}

function CancelInvitationDialog({ invitation }: { invitation: StaffInvitationView }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const { showToast } = useCustomToast();
  const cancel = useCancelStaffInvitation();

  const canSubmit = reason.trim().length >= 3;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setReason('');
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label={`Cancel invitation for ${invitation.email}`}>
          <X className="size-3.5" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel invitation</DialogTitle>
          <DialogDescription>
            The emailed link for {invitation.email} stops working immediately. This is terminal —
            there is no un-cancel, so send a new invitation if this was a mistake.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="cancel-reason">Reason</Label>
          <Textarea
            id="cancel-reason"
            placeholder="Why this invitation is being cancelled — goes on the record."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            disabled={!canSubmit || cancel.isPending}
            className="w-full sm:w-auto"
            onClick={() => {
              cancel.mutate(
                { invitationId: invitation.id, reason: reason.trim() },
                {
                  onSuccess: () => {
                    showToast({ title: 'Invitation cancelled', type: 'success' });
                    setReason('');
                    setOpen(false);
                  },
                  onError: (error) => {
                    showToast({
                      title: 'Could not cancel the invitation',
                      description: errorMessageOf(error),
                      type: 'error',
                    });
                  },
                },
              );
            }}
          >
            {cancel.isPending ? 'Cancelling…' : 'Cancel invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResendInvitationButton({ invitation }: { invitation: StaffInvitationView }) {
  const { showToast } = useCustomToast();
  const resend = useResendStaffInvitation();

  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={`Resend invitation to ${invitation.email}`}
      disabled={resend.isPending}
      onClick={() => {
        resend.mutate(
          { invitationId: invitation.id },
          {
            onSuccess: () => {
              showToast({
                title: 'Invitation re-sent',
                description: 'The previous link no longer works.',
                type: 'success',
              });
            },
            onError: (error) => {
              showToast({
                title: 'Could not resend the invitation',
                description: errorMessageOf(error),
                type: 'error',
              });
            },
          },
        );
      }}
    >
      <Send className="size-3.5" aria-hidden />
    </Button>
  );
}

/**
 * Staff invitations — the lifecycle is fully built server-side (invite,
 * resend, cancel), and `useStaffInvitations` already existed here; this
 * component is what was missing to surface it. `invitedByUserId` is resolved
 * against the live role roster rather than a per-row detail fetch — every
 * inviter holds `role.grant`, so they are always in it.
 */
export function PendingInvitations() {
  const [status, setStatus] = useState<InvitationStatus | typeof ALL>('PENDING');

  const { data, isLoading, error, refetch } = useStaffInvitations({
    status: status === ALL ? undefined : status,
    limit: 25,
  });
  const roster = useRoleRoster();

  const inviterName = (userId: string): string =>
    roster.data?.find((entry) => entry.userId === userId)?.displayName ?? userId;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Pending invitations</h2>
        <Select value={status} onValueChange={(value) => setStatus(value as InvitationStatus | typeof ALL)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option.charAt(0) + option.slice(1).toLowerCase()}
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
        emptyTitle="No invitations"
        emptyDescription="Invitations sent from the Staff directory show up here."
      >
        <div className="border-border overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited by</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.results ?? []).map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="text-[12.5px]">{invitation.email}</TableCell>
                    <TableCell>{invitation.roleName}</TableCell>
                    <TableCell className="text-muted-foreground text-[12px]">
                      {inviterName(invitation.invitedByUserId)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[12px]">
                      {formatDateTime(invitation.lastSentAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[12px]">
                      {formatDateTime(invitation.expiresAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invitationStatusVariant(invitation.status)} className="text-[10.5px]">
                        {invitation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {invitation.status === 'PENDING' ? (
                        <div className="flex justify-end gap-1.5">
                          <ResendInvitationButton invitation={invitation} />
                          <CancelInvitationDialog invitation={invitation} />
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </QueryState>
    </div>
  );
}
