import { Gavel } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/general/module-placeholder';

export const metadata: Metadata = {
  title: 'Disputes',
};

export default function DisputesPage() {
  return (
    <ModulePlaceholder
      title="Disputes"
      description="The adjudication queue: open disputes, the evidence each side filed, and the ruling an operator issued."
      icon={Gavel}
    />
  );
}
