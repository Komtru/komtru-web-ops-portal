'use client';

import { AlertTriangle, LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { PriorityBadge, StatusBadge } from '@/app/(dashboard)/tickets/badges';
import { QueryState } from '@/components/general/query-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime } from '@/helpers/format';
import { useTicketQueues, useTickets } from '@/services/tickets.services';
import type { TicketListFilters, TicketPriority, TicketStatus } from '@/interfaces/tickets';

const STATUSES: TicketStatus[] = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_CUSTOMER',
  'WAITING_INTERNAL',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
];

const PRIORITIES: TicketPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const ALL = '__all__';

/**
 * The queue list (§7's staff surface): filter by queue, status and priority, with an SLA-breach
 * indicator on every row so an agent does not have to open a ticket to know it needs attention.
 */
export function TicketsView() {
  const [filters, setFilters] = useState<TicketListFilters>({ limit: 50, offset: 0 });

  const queues = useTicketQueues();
  const tickets = useTickets(filters);

  const rows = tickets.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <LifeBuoy className="size-5" aria-hidden />
            Tickets
          </h1>
          <p className="text-muted-foreground text-[12.5px] leading-relaxed">
            Every support conversation on the platform — customer-filed and auto-opened alike.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.queueCode ?? ALL}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, queueCode: value === ALL ? undefined : value, offset: 0 }))
          }
        >
          <SelectTrigger className="w-[200px]" aria-label="Filter by queue">
            <SelectValue placeholder="All queues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All queues</SelectItem>
            {(queues.data ?? []).map((queue) => (
              <SelectItem key={queue.code} value={queue.code}>
                {queue.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              status: value === ALL ? undefined : (value as TicketStatus),
              offset: 0,
            }))
          }
        >
          <SelectTrigger className="w-[180px]" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replaceAll('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority ?? ALL}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              priority: value === ALL ? undefined : (value as TicketPriority),
              offset: 0,
            }))
          }
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by priority">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All priorities</SelectItem>
            {PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueryState
        isLoading={tickets.isLoading}
        error={tickets.error}
        isEmpty={rows.length === 0}
        onRetry={() => void tickets.refetch()}
        emptyTitle="No tickets match these filters"
      >
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Queue</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((ticket) => {
                const breached = ticket.firstResponseBreached || ticket.resolutionBreached;

                return (
                  <TableRow key={ticket.id} className="hover:bg-accent/40">
                    <TableCell>
                      <Link href={`/tickets/${ticket.id}`} className="hover:underline">
                        <span className="trade-code font-medium">{ticket.ticketNumber}</span>
                        <p className="text-muted-foreground max-w-[280px] truncate text-xs">
                          {ticket.category}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell>{ticket.queueCode.replaceAll('_', ' ')}</TableCell>
                    <TableCell>
                      <PriorityBadge priority={ticket.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>
                      {breached ? (
                        <span className="text-komtru-risk inline-flex items-center gap-1 text-xs font-semibold">
                          <AlertTriangle className="size-3.5" aria-hidden />
                          Breached
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">On track</span>
                      )}
                    </TableCell>
                    <TableCell className="trade-code text-xs">
                      {ticket.assignedAgentId ? ticket.assignedAgentId.slice(0, 8) : 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDateTime(ticket.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </QueryState>
    </div>
  );
}
