'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { INVITABLE_STAFF_ROLES } from '@/config/roles';
import { useCustomToast } from '@/hooks/useCustomToast';
import { errorMessageOf } from '@/components/general/query-state';
import { useInviteStaffMember } from '@/services/staff.services';

/**
 * Wired to identity's real staff-invitation service (`POST
 * /admin/staff/invitations`) — this dialog collects the same fields that
 * service already requires, it does not invent a new invitation flow.
 */
export function InviteStaffDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [reason, setReason] = useState('');
  const [displayName, setDisplayName] = useState('');

  const { showToast } = useCustomToast();
  const invite = useInviteStaffMember();

  const canSubmit = email.trim().length > 3 && roleCode.length > 0 && reason.trim().length >= 3;

  const reset = () => {
    setEmail('');
    setRoleCode('');
    setReason('');
    setDisplayName('');
  };

  const handleSubmit = () => {
    invite.mutate(
      {
        email: email.trim(),
        roleCode,
        reason: reason.trim(),
        ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
      },
      {
        onSuccess: (invitation) => {
          showToast({
            title: 'Invitation sent',
            description: `${invitation.email} was invited as ${invitation.roleName}.`,
            type: 'success',
          });
          reset();
          setOpen(false);
        },
        onError: (error) => {
          showToast({
            title: 'Could not send the invitation',
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
        <Button size="sm">
          <UserPlus className="size-4" aria-hidden />
          Invite staff
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a staff member</DialogTitle>
          <DialogDescription>
            Sends an invitation to claim staff access on the invited email&apos;s account — the
            same account they already use as a buyer or seller, if they have one. There is no
            separate staff sign-up.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-display-name">Display name (optional)</Label>
            <Input
              id="invite-display-name"
              placeholder="How this person should show up in the console"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={roleCode} onValueChange={setRoleCode}>
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {INVITABLE_STAFF_ROLES.map((role) => (
                  <SelectItem key={role.code} value={role.code}>
                    {role.name}
                    {role.requiresDualApproval ? ' (needs a second approver)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-reason">Reason</Label>
            <Textarea
              id="invite-reason"
              placeholder="Why this person needs this role — goes on the record."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || invite.isPending}
            className="w-full sm:w-auto"
          >
            {invite.isPending ? 'Sending…' : 'Send invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
