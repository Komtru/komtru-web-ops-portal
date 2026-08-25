import type { Metadata } from 'next';

import { StaffMembersView } from '@/app/(dashboard)/directory/staff/StaffMembersView';

export const metadata: Metadata = {
  title: 'Staff Members',
};

export default function StaffMembersPage() {
  return <StaffMembersView />;
}
