import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TicketPriority, TicketStatus } from '@/interfaces/tickets';

/** Shared priority/status pills for the ticket list and detail views. */

const PRIORITY_CLASS: Record<TicketPriority, string> = {
  LOW: 'bg-komtru-slate-100 text-komtru-slate-600 dark:bg-komtru-slate-800 dark:text-komtru-slate-300',
  NORMAL: 'bg-komtru-blue/10 text-komtru-blue dark:bg-komtru-blue/15',
  HIGH: 'bg-komtru-warning-soft text-komtru-warning-on-soft dark:bg-komtru-warning/15 dark:text-komtru-warning',
  URGENT: 'bg-komtru-risk-soft text-komtru-risk-on-soft dark:bg-komtru-risk/15 dark:text-komtru-risk',
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge variant="outline" className={cn('border-transparent', PRIORITY_CLASS[priority])}>
      {priority}
    </Badge>
  );
}

const STATUS_CLASS: Record<TicketStatus, string> = {
  OPEN: 'bg-komtru-blue/10 text-komtru-blue dark:bg-komtru-blue/15',
  ASSIGNED: 'bg-komtru-blue/10 text-komtru-blue dark:bg-komtru-blue/15',
  IN_PROGRESS: 'bg-komtru-blue/10 text-komtru-blue dark:bg-komtru-blue/15',
  WAITING_CUSTOMER:
    'bg-komtru-warning-soft text-komtru-warning-on-soft dark:bg-komtru-warning/15 dark:text-komtru-warning',
  WAITING_INTERNAL:
    'bg-komtru-warning-soft text-komtru-warning-on-soft dark:bg-komtru-warning/15 dark:text-komtru-warning',
  RESOLVED:
    'bg-komtru-success-soft text-komtru-success-on-soft dark:bg-komtru-success/15 dark:text-komtru-success',
  CLOSED: 'bg-komtru-slate-100 text-komtru-slate-600 dark:bg-komtru-slate-800 dark:text-komtru-slate-300',
  REOPENED: 'bg-komtru-risk-soft text-komtru-risk-on-soft dark:bg-komtru-risk/15 dark:text-komtru-risk',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant="outline" className={cn('border-transparent', STATUS_CLASS[status])}>
      {status.replaceAll('_', ' ')}
    </Badge>
  );
}
