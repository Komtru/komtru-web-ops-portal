import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { IResponse, RequestError } from '@/interfaces/IAxios';
import type {
  Ticket,
  TicketDetail,
  TicketListFilters,
  TicketMessage,
  TicketQueue,
  UpdateQueuePayload,
} from '@/interfaces/tickets';
import { http } from '@/services/base';

/**
 * M10 (Tickets / Customer Support) — the operator/admin surface.
 *
 * Follows `organization.services.ts`'s reference shape: structured query keys, one `use<Verb><Noun>`
 * hook per endpoint, `http.*` called only from here. Every mutation invalidates `ticketKeys.all` rather
 * than a narrower key — the list view's SLA-breach indicator and a ticket's own detail can both change
 * from the same action (e.g. resolving clears a breach flag on both), and this module's mutation volume
 * does not justify hand-tuned invalidation.
 */

export const ticketKeys = {
  all: ['tickets'] as const,
  list: (filters: TicketListFilters) => [...ticketKeys.all, 'list', filters] as const,
  detail: (id: string) => [...ticketKeys.all, 'detail', id] as const,
  queues: () => [...ticketKeys.all, 'queues'] as const,
};

export function useTickets(filters: TicketListFilters) {
  return useQuery<Ticket[], RequestError>({
    queryKey: ticketKeys.list(filters),
    queryFn: async () => {
      const response = await http.get<IResponse<Ticket[]>>({
        url: 'admin/tickets',
        query: { ...filters },
      });
      return response.data;
    },
  });
}

export function useTicket(id: string | undefined) {
  return useQuery<TicketDetail, RequestError>({
    queryKey: ticketKeys.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await http.get<IResponse<TicketDetail>>({ url: `admin/tickets/${id}` });
      return response.data;
    },
  });
}

export function useTicketQueues() {
  return useQuery<TicketQueue[], RequestError>({
    queryKey: ticketKeys.queues(),
    queryFn: async () => {
      const response = await http.get<IResponse<TicketQueue[]>>({ url: 'admin/ticket-queues' });
      return response.data;
    },
  });
}

function useTicketAction<TVariables extends { ticketId: string }, TData = Ticket>(
  mutationKeySuffix: string,
  path: (ticketId: string) => string,
) {
  const queryClient = useQueryClient();

  return useMutation<TData, RequestError, TVariables>({
    mutationKey: [...ticketKeys.all, mutationKeySuffix],
    mutationFn: async ({ ticketId, ...body }) => {
      const response = await http.post<IResponse<TData>>({ url: path(ticketId), body });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}

/** Omitting `agentId` assigns to the currently signed-in agent — the common "claim this" case. */
export function useAssignTicket() {
  return useTicketAction<{ ticketId: string; agentId?: string }>(
    'assign',
    (id) => `admin/tickets/${id}/assign`,
  );
}

/** `ticket.reassign` — SUPPORT_LEAD only. The API 403s anyone else; this hook does not pre-check that. */
export function useReassignTicket() {
  return useTicketAction<{ ticketId: string; agentId: string }>(
    'reassign',
    (id) => `admin/tickets/${id}/reassign`,
  );
}

export function useReplyInternal() {
  return useTicketAction<{ ticketId: string; body: string; attachmentRefs?: string[] }, TicketMessage>(
    'reply-internal',
    (id) => `admin/tickets/${id}/reply-internal`,
  );
}

export function useReplyExternal() {
  return useTicketAction<{ ticketId: string; body: string; attachmentRefs?: string[] }, TicketMessage>(
    'reply-external',
    (id) => `admin/tickets/${id}/reply-external`,
  );
}

export function useResolveTicket() {
  return useTicketAction<{ ticketId: string; resolutionSummary?: string }>(
    'resolve',
    (id) => `admin/tickets/${id}/resolve`,
  );
}

interface EscalateResult {
  ticket: Ticket;
  escalation: { id: string; status: string };
}

/**
 * §5's one deliberate crossing point into Disputes. The result carries the ticket (now
 * `WAITING_INTERNAL`) and the escalation record — the backend does not fabricate an M3 dispute id, and
 * neither does this hook; see `TicketDetailView`'s escalation panel for how that is presented.
 */
export function useEscalateTicket() {
  return useTicketAction<{ ticketId: string; reason: string }, EscalateResult>(
    'escalate-to-dispute',
    (id) => `admin/tickets/${id}/escalate-to-dispute`,
  );
}

export function useUpdateQueue() {
  const queryClient = useQueryClient();

  return useMutation<TicketQueue, RequestError, { code: string } & UpdateQueuePayload>({
    mutationKey: [...ticketKeys.all, 'update-queue'],
    mutationFn: async ({ code, ...body }) => {
      const response = await http.put<IResponse<TicketQueue>>({ url: `admin/ticket-queues/${code}`, body });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.queues() });
    },
  });
}
