import { Users } from 'lucide-react';
import type { Metadata } from 'next';

import { ModulePlaceholder } from '@/components/general/module-placeholder';

export const metadata: Metadata = {
  title: 'Customers',
};

/**
 * Consumer-account lookup — buyer/seller accounts, not staff.
 *
 * Out of scope for M14 (Administration): this screen is the pre-existing
 * "look up any account" placeholder, moved here unchanged when `Directory`
 * split into Customers/Staff Members. Building it out is a quick, well-scoped
 * follow-up for whoever picks up the consumer-directory work next — the
 * `user.search` / `user.view` endpoints it needs already exist in identity.
 */
export default function CustomersPage() {
  return (
    <ModulePlaceholder
      title="Customers"
      description="Look up any consumer account on the platform and open its full operator record — identity, trade history, and the actions taken on it."
      icon={Users}
    />
  );
}
