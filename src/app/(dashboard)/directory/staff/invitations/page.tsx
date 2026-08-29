import type { Metadata } from 'next';

import { StaffInvitationsView } from '@/app/(dashboard)/directory/staff/invitations/StaffInvitationsView';

export const metadata: Metadata = {
  title: 'Staff Invitations',
};

export default function StaffInvitationsPage() {
  return <StaffInvitationsView />;
}
