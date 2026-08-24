import { Users } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/general/module-placeholder';

export const metadata: Metadata = {
  title: 'Directory',
};

export default function DirectoryPage() {
  return (
    <ModulePlaceholder
      title="Directory"
      description="Look up any account on the platform and open its full operator record — identity, trade history, and the actions taken on it."
      icon={Users}
    />
  );
}
