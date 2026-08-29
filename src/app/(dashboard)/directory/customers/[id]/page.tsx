import type { Metadata } from 'next';

import { CustomerDetailView } from '@/app/(dashboard)/directory/customers/[id]/CustomerDetailView';

export const metadata: Metadata = {
  title: 'Customer',
};

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;
  return <CustomerDetailView userId={id} />;
}
