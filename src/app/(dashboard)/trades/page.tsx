import { ArrowLeftRight } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/general/module-placeholder';

export const metadata: Metadata = {
  title: 'Trades',
};

export default function TradesPage() {
  return (
    <ModulePlaceholder
      title="Trades"
      description="Every trade on the platform, filterable by state and counterparty, with the timeline of each one for when an operator has to reconstruct what happened."
      icon={ArrowLeftRight}
    />
  );
}
