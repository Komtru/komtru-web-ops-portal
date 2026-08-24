import { Landmark } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/general/module-placeholder';

export const metadata: Metadata = {
  title: 'Settlements & Ledger',
};

export default function SettlementsAndLedgerPage() {
  return (
    <ModulePlaceholder
      title="Settlements & Ledger"
      description="Payouts leaving escrow and the double-entry record behind them, for reconciling what the platform moved against what it owes."
      icon={Landmark}
    />
  );
}
