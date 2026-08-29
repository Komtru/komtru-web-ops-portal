'use client';

import { useState } from 'react';
import { ShieldMinus } from 'lucide-react';

import { errorMessageOf } from '@/components/general/query-state';
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
import { useCustomToast } from '@/hooks/useCustomToast';
import type { AccountManagerSummary } from '@/interfaces/accountManager';
import { useOffboardAccountManager } from '@/services/accountManagers.services';
import { useRevokeStaffRole } from '@/services/staff.services';

interface AccountManagerOffboardDialogProps {
  userId: string;
  roleCode: string;
  roleLabel: string;
  customerCount: number;
  /** Active account managers this person could hand their book to — excludes themself. */
  otherAccountManagers: AccountManagerSummary[];
}

type Mode = 'auto' | 'replacement';

/**
 * Revoking `ACCOUNT_MANAGER` from someone with active customers.
 *
 * The offboard endpoint (`POST /admin/account-managers/:staffId/offboard`)
 * deliberately does NOT revoke the role itself — that stays identity's
 * existing `POST/DELETE .../roles/:roleCode` — so this dialog glues the two
 * into one admin-facing action, in order: offboard (reassign customers)
 * THEN revoke. If revoke fails after a successful offboard, the dialog stays
 * open with the customers already moved and lets the admin retry the revoke
 * alone, rather than re-running the offboard call against a book that may
 * now be empty.
 */
export function AccountManagerOffboardDialog({
  userId,
  roleCode,
  roleLabel,
  customerCount,
  otherAccountManagers,
}: AccountManagerOffboardDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('auto');
  const [replacementId, setReplacementId] = useState('');
  const [reason, setReason] = useState('');
  const [offboardDone, setOffboardDone] = useState(false);

  const { showToast } = useCustomToast();
  const offboard = useOffboardAccountManager();
  const revoke = useRevokeStaffRole();

  const canSubmit = reason.trim().length >= 3 && (mode === 'auto' || replacementId.length > 0);
  const isPending = offboard.isPending || revoke.isPending;

  const reset = () => {
    setMode('auto');
    setReplacementId('');
    setReason('');
    setOffboardDone(false);
  };

  const runRevoke = () => {
    revoke.mutate(
      { userId, roleCode, reason: reason.trim() },
      {
        onSuccess: () => {
          showToast({
            title: `${roleLabel} revoked`,
            description: `${customerCount} customer${customerCount === 1 ? '' : 's'} reassigned.`,
            type: 'success',
          });
          reset();
          setOpen(false);
        },
        onError: (error) => {
          showToast({
            title: 'Customers were reassigned, but the role could not be revoked',
            description: `${errorMessageOf(error)} The customers stayed reassigned — retry revoking the role.`,
            type: 'error',
          });
        },
      },
    );
  };

  const handleSubmit = () => {
    if (offboardDone) {
      runRevoke();
      return;
    }

    offboard.mutate(
      {
        staffId: userId,
        ...(mode === 'replacement' ? { replacementAccountManagerId: replacementId } : {}),
      },
      {
        onSuccess: () => {
          setOffboardDone(true);
          runRevoke();
        },
        onError: (error) => {
          showToast({
            title: "Couldn't reassign this account manager's customers",
            description: errorMessageOf(error),
            type: 'error',
          });
        },
      },
    );
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
        <Button variant="outline" size="icon-sm" aria-label={`Revoke ${roleLabel}`}>
          <ShieldMinus className="size-3.5" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Offboard this account manager</DialogTitle>
          <DialogDescription>
            This account manager has {customerCount} active customer{customerCount === 1 ? '' : 's'}.
            Reassign them before the {roleLabel} role can be revoked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Customers</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'auto' ? 'default' : 'outline'}
                size="sm"
                disabled={offboardDone}
                onClick={() => setMode('auto')}
              >
                Redistribute automatically
              </Button>
              <Button
                type="button"
                variant={mode === 'replacement' ? 'default' : 'outline'}
                size="sm"
                disabled={offboardDone}
                onClick={() => setMode('replacement')}
              >
                Choose a replacement
              </Button>
            </div>
          </div>

          {mode === 'replacement' ? (
            <div className="space-y-1.5">
              <Label htmlFor="offboard-replacement">Replacement account manager</Label>
              <Select value={replacementId} onValueChange={setReplacementId} disabled={offboardDone}>
                <SelectTrigger id="offboard-replacement" className="w-full">
                  <SelectValue placeholder="Choose a replacement" />
                </SelectTrigger>
                <SelectContent>
                  {otherAccountManagers.map((am) => (
                    <SelectItem key={am.staffId} value={am.staffId}>
                      {am.displayName} · {am.customerCount} customer{am.customerCount === 1 ? '' : 's'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="offboard-reason">Reason</Label>
            <Textarea
              id="offboard-reason"
              placeholder="Why this role is being revoked — goes on the record."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              disabled={offboardDone}
            />
          </div>

          {offboardDone ? (
            <p className="text-komtru-success text-[12px]">
              Customers reassigned. Revoke the role to finish.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            disabled={!canSubmit || isPending}
            className="w-full sm:w-auto"
            onClick={handleSubmit}
          >
            {isPending
              ? offboardDone
                ? 'Revoking…'
                : 'Reassigning…'
              : offboardDone
                ? 'Revoke role'
                : 'Reassign and revoke'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
