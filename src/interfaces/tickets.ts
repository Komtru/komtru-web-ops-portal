/**
 * M10 (Tickets / Customer Support) — response shapes from `/admin/tickets` and `/admin/ticket-queues`.
 *
 * Mirrors `backend-apis/src/modules/tickets/http/controllers.ts`'s `serializeTicket` /
 * `serializeMessage` / `serializeQueue` field-for-field. The two message arrays on `TicketDetail`
 * stay separate on purpose — see the note on `TicketDetail` below.
 */

export type TicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_CUSTOMER'
  | 'WAITING_INTERNAL'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type TicketChannel = 'IN_APP' | 'EMAIL' | 'WHATSAPP' | 'SYSTEM_AUTO';

export type MessageVisibility = 'CUSTOMER_VISIBLE' | 'INTERNAL_NOTE';

export type MessageSenderType = 'CUSTOMER' | 'AGENT' | 'SYSTEM';

export interface Ticket {
  id: string;
  ticketNumber: string;
  userId: string;
  queueCode: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  channel: TicketChannel;
  assignedAgentId: string | null;
  relatedTradeId: string | null;
  relatedPaymentId: string | null;
  relatedShipmentId: string | null;
  relatedDisputeId: string | null;
  sourceEvent: string | null;
  createdAt: string;
  firstResponseDueAt: string;
  resolutionDueAt: string;
  firstRespondedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
  reopenCount: number;
  reopenableUntil: string | null;
}

export interface TicketMessage {
  id: string;
  senderType: MessageSenderType;
  senderId: string | null;
  visibility: MessageVisibility;
  body: string;
  attachmentRefs: string[];
  createdAt: string;
}

export interface TicketEscalation {
  id: string;
  status: 'PENDING_M3' | 'LINKED';
  reason: string;
  requestedByType: 'AGENT' | 'CUSTOMER';
  requestedAt: string;
  disputeId: string | null;
}

export interface TicketQueue {
  code: string;
  name: string;
  slaFirstResponseHours: number;
  slaResolutionHours: number;
  defaultPriority: TicketPriority;
}

/**
 * `GET /admin/tickets/:id`'s shape. `customerVisibleMessages` and `internalNotes` are two SEPARATE
 * arrays, exactly as the backend returns them (D2) — never combined client-side into one thread with a
 * visibility flag. `TicketDetailView` renders them as two visually distinct panels for the same reason.
 */
export interface TicketDetail {
  ticket: Ticket;
  customerVisibleMessages: TicketMessage[];
  internalNotes: TicketMessage[];
  escalations: TicketEscalation[];
}

export interface TicketListFilters {
  queueCode?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedAgentId?: string;
  limit?: number;
  offset?: number;
}

export interface UpdateQueuePayload {
  name?: string;
  slaFirstResponseHours?: number;
  slaResolutionHours?: number;
  defaultPriority?: TicketPriority;
}
