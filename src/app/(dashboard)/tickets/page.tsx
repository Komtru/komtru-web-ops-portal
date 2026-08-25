import type { Metadata } from 'next';

import { TicketsView } from '@/app/(dashboard)/tickets/TicketsView';

export const metadata: Metadata = {
  title: 'Tickets',
};

export default function TicketsPage() {
  return <TicketsView />;
}
