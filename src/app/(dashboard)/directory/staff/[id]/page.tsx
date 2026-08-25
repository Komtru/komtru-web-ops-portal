import type { Metadata } from 'next';

import { StaffMemberDetailView } from '@/app/(dashboard)/directory/staff/[id]/StaffMemberDetailView';

export const metadata: Metadata = {
  title: 'Staff Member',
};

interface StaffMemberPageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffMemberPage({ params }: StaffMemberPageProps) {
  const { id } = await params;
  return <StaffMemberDetailView userId={id} />;
}
