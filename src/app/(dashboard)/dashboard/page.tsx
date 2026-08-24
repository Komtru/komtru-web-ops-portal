import type { Metadata } from 'next';

import { CommandCenterView } from '@/app/(dashboard)/dashboard/CommandCenterView';

export const metadata: Metadata = {
  title: 'Command Center',
};

export default function DashboardPage() {
  return <CommandCenterView />;
}
