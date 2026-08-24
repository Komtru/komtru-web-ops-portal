import { BadgeCheck } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/general/module-placeholder';

export const metadata: Metadata = {
  title: 'KYC & Verifications',
};

export default function KycAndVerificationsPage() {
  return (
    <ModulePlaceholder
      title="KYC & Verifications"
      description="Review submitted identity documents, approve or reject verification attempts, and see the level each account currently holds."
      icon={BadgeCheck}
    />
  );
}
