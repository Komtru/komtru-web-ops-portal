import { ScrollText } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/general/module-placeholder';

export const metadata: Metadata = {
  title: 'Audit Trail',
};

export default function AuditTrailPage() {
  return (
    <ModulePlaceholder
      title="Audit Trail"
      description="An append-only record of what every operator did in the console — who acted, on which account, and when."
      icon={ScrollText}
    />
  );
}
