import { redirect } from 'next/navigation';

/**
 * `Directory` is now a group (Customers / Staff Members — see
 * `src/config/menu.tsx`), so the bare `/directory` route has no screen of
 * its own. Customers is the broader, ungated entry, so it is the sensible
 * landing spot for anyone who still links straight to `/directory`.
 */
export default function DirectoryPage() {
  redirect('/directory/customers');
}
