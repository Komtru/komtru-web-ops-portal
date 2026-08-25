'use client';

import { useState } from 'react';
import { ShieldMinus, ShieldPlus } from 'lucide-react';

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
import { STAFF_ROLES } from '@/config/roles';
import { errorMessageOf } from '@/components/general/query-state';
import { useCustomToast } from '@/hooks/useCustomToast';
import { useGrantStaffRole, useRevokeStaffRole } from '@/services/staff.services';

interface GrantRoleDialogProps {
  userId: string;
  /** Roles this account already holds — offered roles exclude these. */
  heldRoleCodes: string[];
}

export function GrantRoleDialog({ userId, heldRoleCodes }: GrantRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [roleCode, setRoleCode] = useState('');
  const [reason, setReason] = useState('');

  const { showToast } = useCustomToast();
  const grant = useGrantStaffRole();

  const availableRoles = STAFF_ROLES.filter((role) => !heldRoleCodes.includes(role.code));
  const canSubmit = roleCode.length > 0 && reason.trim().length >= 3;

  const reset = () => {
    setRoleCode('');
    setReason('');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldPlus className="size-3.5" aria-hidden />
          Grant role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant a role</DialogTitle>
          <DialogDescription>
            Some roles need a second approver before they take effect — the API enforces that, this
            dialog does not decide it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="grant-role">Role</Label>
            <Select value={roleCode} onValueChange={setRoleCode}>
              <SelectTrigger id="grant-role" className="w-full">
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.code} value={role.code}>
                    {role.name}
                    {role.requiresDualApproval ? ' (needs a second approver)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="grant-reason">Reason</Label>
            <Textarea
              id="grant-reason"
              placeholder="Why this person needs this role — goes on the record."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={!canSubmit || grant.isPending}
            className="w-full sm:w-auto"
            onClick={() => {
              grant.mutate(
                { userId, roleCode, reason: reason.trim() },
                {
                  onSuccess: () => {
                    showToast({ title: 'Role granted', type: 'success' });
                    reset();
                    setOpen(false);
                  },
                  onError: (error) => {
                    showToast({
                      title: 'Could not grant the role',
                      description: errorMessageOf(error),
                      type: 'error',
                    });
                  },
                },
              );
            }}
          >
            {grant.isPending ? 'Granting…' : 'Grant role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RevokeRoleDialogProps {
  userId: string;
  roleCode: string;
  roleLabel: string;
}

export function RevokeRoleDialog({ userId, roleCode, roleLabel }: RevokeRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const { showToast } = useCustomToast();
  const revoke = useRevokeStaffRole();

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
        <Button variant="outline" size="icon-sm" aria-label={`Revoke ${roleLabel}`}>
          <ShieldMinus className="size-3.5" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke {roleLabel}</DialogTitle>
          <DialogDescription>
            This takes effect immediately. The person keeps their underlying account — only this
            role is removed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="revoke-reason">Reason</Label>
          <Textarea
            id="revoke-reason"
            placeholder="Why this role is being revoked — goes on the record."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            disabled={!canSubmit || revoke.isPending}
            className="w-full sm:w-auto"
            onClick={() => {
              revoke.mutate(
                { userId, roleCode, reason: reason.trim() },
                {
                  onSuccess: () => {
                    showToast({ title: `${roleLabel} revoked`, type: 'success' });
                    setReason('');
                    setOpen(false);
                  },
                  onError: (error) => {
                    showToast({
                      title: 'Could not revoke the role',
                      description: errorMessageOf(error),
                      type: 'error',
                    });
                  },
                },
              );
            }}
          >
            {revoke.isPending ? 'Revoking…' : 'Revoke role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
