'use client';

import { MailCheck } from 'lucide-react';

import { InviteStaffDialog } from '@/app/(dashboard)/directory/staff/invitations/InviteStaffDialog';
import { PendingInvitations } from '@/app/(dashboard)/directory/staff/invitations/PendingInvitations';

export function StaffInvitationsView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <MailCheck className="text-muted-foreground size-[18px]" aria-hidden />
            Staff Invitations
          </h1>
          <p className="text-muted-foreground max-w-2xl text-[12.5px] leading-relaxed">
            Invite people to claim staff access, and track invitations that are pending, claimed,
            expired or cancelled.
          </p>
        </div>
        <InviteStaffDialog />
      </div>

      <PendingInvitations />
    </div>
  );
}
