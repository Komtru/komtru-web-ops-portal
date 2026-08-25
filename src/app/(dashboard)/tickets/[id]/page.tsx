import type { Metadata } from 'next';

import { TicketDetailView } from '@/app/(dashboard)/tickets/[id]/TicketDetailView';

export const metadata: Metadata = {
  title: 'Ticket',
};

interface TicketDetailPageProps {
  // Next 15: dynamic route params are async in a server component.
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = await params;
  return <TicketDetailView ticketId={id} />;
}
