'use client';

import { useState } from 'react';
import { UserCog } from 'lucide-react';

import { QueryState, errorMessageOf } from '@/components/general/query-state';
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
import { useCustomToast } from '@/hooks/useCustomToast';
import { useAccountManagerList, useAssignAccountManager } from '@/services/accountManagers.services';

interface AssignAccountManagerDialogProps {
  userId: string;
  currentAccountManagerId?: string | null;
  currentAccountManagerName?: string | null;
  /** `sm` for a list-row action, `default` for the detail page. */
  size?: 'sm' | 'default';
}

/**
 * Manual (re)assign — `POST /admin/customers/:userId/account-manager` with
 * `{ accountManagerId }`. Shared between the Customers list row action and
 * the customer detail page.
 */
export function AssignAccountManagerDialog({
  userId,
  currentAccountManagerId,
  currentAccountManagerName,
  size = 'sm',
}: AssignAccountManagerDialogProps) {
  const [open, setOpen] = useState(false);
  const [accountManagerId, setAccountManagerId] = useState('');

  const { showToast } = useCustomToast();
  const accountManagers = useAccountManagerList();
  const assign = useAssignAccountManager();

  const isReassign = Boolean(currentAccountManagerId);
  const amList = Array.isArray(accountManagers.data) ? accountManagers.data : [];
  const options = amList.filter(
    (am) => am.staffId !== currentAccountManagerId,
  );

  const reset = () => setAccountManagerId('');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size={size === 'sm' ? 'sm' : 'default'}>
          <UserCog className="size-3.5" aria-hidden />
          {isReassign ? 'Reassign' : 'Assign account manager'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isReassign ? 'Reassign account manager' : 'Assign an account manager'}</DialogTitle>
          <DialogDescription>
            {isReassign && currentAccountManagerName
              ? `Currently assigned to ${currentAccountManagerName}.`
              : 'This customer has no account manager yet.'}
          </DialogDescription>
        </DialogHeader>

        <QueryState
          isLoading={accountManagers.isLoading}
          error={accountManagers.error}
          isEmpty={!accountManagers.isLoading && !accountManagers.error && options.length === 0}
          onRetry={() => void accountManagers.refetch()}
          emptyTitle="No other account managers available"
          emptyDescription="Invite someone with the Account Manager role first."
        >
          <div className="space-y-1.5">
            <Label htmlFor="assign-account-manager">Account manager</Label>
            <Select value={accountManagerId} onValueChange={setAccountManagerId}>
              <SelectTrigger id="assign-account-manager" className="w-full">
                <SelectValue placeholder="Choose an account manager" />
              </SelectTrigger>
              <SelectContent>
                {options.map((am) => (
                  <SelectItem key={am.staffId} value={am.staffId}>
                    {am.displayName} · {am.customerCount} customer{am.customerCount === 1 ? '' : 's'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </QueryState>

        <DialogFooter>
          <Button
            disabled={!accountManagerId || assign.isPending}
            className="w-full sm:w-auto"
            onClick={() => {
              assign.mutate(
                { userId, accountManagerId },
                {
                  onSuccess: () => {
                    showToast({ title: 'Account manager assigned', type: 'success' });
                    reset();
                    setOpen(false);
                  },
                  onError: (error) => {
                    showToast({
                      title: 'Could not assign an account manager',
                      description: errorMessageOf(error),
                      type: 'error',
                    });
                  },
                },
              );
            }}
          >
            {assign.isPending ? 'Assigning…' : isReassign ? 'Reassign' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
