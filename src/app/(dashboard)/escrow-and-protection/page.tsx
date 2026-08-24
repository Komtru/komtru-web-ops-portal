import { Vault } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/general/module-placeholder';

export const metadata: Metadata = {
  title: 'Escrow & Protection',
};

export default function EscrowAndProtectionPage() {
  return (
    <ModulePlaceholder
      title="Escrow & Protection"
      description="Funds the platform is holding against open trades, plus the release and refund actions available to an operator."
      icon={Vault}
    />
  );
}
