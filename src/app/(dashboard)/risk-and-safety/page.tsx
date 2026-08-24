import { ShieldAlert } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/general/module-placeholder';

export const metadata: Metadata = {
  title: 'Risk & Safety',
};

export default function RiskAndSafetyPage() {
  return (
    <ModulePlaceholder
      title="Risk & Safety"
      description="Flagged accounts and behaviour the platform considers risky, and the restrictions an operator can place in response."
      icon={ShieldAlert}
    />
  );
}
