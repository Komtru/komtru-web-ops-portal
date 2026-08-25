'use client';

import { AlertTriangle, ArrowLeft, Gavel, MessageSquare, ShieldAlert, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { PriorityBadge, StatusBadge } from '@/app/(dashboard)/tickets/badges';
import { errorMessageOf, QueryState } from '@/components/general/query-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/helpers/format';
import { useCustomToast } from '@/hooks/useCustomToast';
import {
  useAssignTicket,
  useEscalateTicket,
  useReassignTicket,
  useReplyExternal,
  useReplyInternal,
  useResolveTicket,
  useTicket,
} from '@/services/tickets.services';
import type { TicketMessage } from '@/interfaces/tickets';

const TERMINAL_STATUSES = new Set(['RESOLVED', 'CLOSED']);

function MessageBubble({ message, tone }: { message: TicketMessage; tone: 'customer' | 'internal' }) {
  return (
    <div
      className={
        tone === 'internal'
          ? 'border-komtru-warning/30 bg-komtru-warning-soft/40 dark:bg-komtru-warning/10 rounded-lg border p-3'
          : 'bg-muted/50 rounded-lg border p-3'
      }
    >
      <div className="text-muted-foreground mb-1 flex items-center justify-between gap-2 text-[11px]">
        <span className="font-semibold tracking-wide uppercase">
          {message.senderType === 'SYSTEM' ? 'System' : message.senderType === 'AGENT' ? 'Agent' : 'Customer'}
        </span>
        <span>{formatDateTime(message.createdAt)}</span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.body}</p>
    </div>
  );
}

/**
 * The ticket detail view (§7): the customer-visible thread and internal notes rendered as two clearly
 * distinct tabs — never one interleaved list. Reusing `Tabs` (rather than two always-visible panels) is
 * a deliberate extra guard: an internal note cannot render alongside the customer thread even by
 * accident, because switching tabs is the only way to see it at all.
 */
export function TicketDetailView({ ticketId }: { ticketId: string }) {
  const { data, isLoading, error, refetch } = useTicket(ticketId);
  const { showToast } = useCustomToast();

  const assign = useAssignTicket();
  const reassign = useReassignTicket();
  const replyExternal = useReplyExternal();
  const replyInternal = useReplyInternal();
  const resolve = useResolveTicket();
  const escalate = useEscalateTicket();

  const [reassignAgentId, setReassignAgentId] = useState('');
  const [reassignOpen, setReassignOpen] = useState(false);
  const [resolveSummary, setResolveSummary] = useState('');
  const [resolveOpen, setResolveOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [externalReply, setExternalReply] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const onError = (title: string) => (err: unknown) =>
    showToast({ title, description: errorMessageOf(err), type: 'error' });

  return (
    <div className="space-y-6">
      <Link
        href="/tickets"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All tickets
      </Link>

      <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()}>
        {data ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="trade-code text-xl font-semibold">{data.ticket.ticketNumber}</h1>
                  <PriorityBadge priority={data.ticket.priority} />
                  <StatusBadge status={data.ticket.status} />
                  {(data.ticket.firstResponseBreached || data.ticket.resolutionBreached) && (
                    <span className="text-komtru-risk inline-flex items-center gap-1 text-xs font-semibold">
                      <AlertTriangle className="size-3.5" aria-hidden />
                      SLA breached
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium">{data.ticket.category}</p>
                <p className="text-muted-foreground text-xs">
                  {data.ticket.queueCode.replaceAll('_', ' ')} · Opened {formatDateTime(data.ticket.createdAt)}
                  {data.ticket.sourceEvent ? (
                    <>
                      {' '}
                      · Auto-opened from{' '}
                      <span className="trade-code">{data.ticket.sourceEvent}</span>
                    </>
                  ) : null}
                  {data.ticket.reopenCount > 0 ? <> · Reopened {data.ticket.reopenCount}×</> : null}
                </p>
                <p className="text-muted-foreground trade-code text-xs">
                  Assigned to{' '}
                  {data.ticket.assignedAgentId ? data.ticket.assignedAgentId : 'nobody yet'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={assign.isPending}
                  onClick={() =>
                    assign.mutate(
                      { ticketId },
                      {
                        onSuccess: () => showToast({ title: 'Assigned to you', type: 'success' }),
                        onError: onError('Could not assign this ticket'),
                      },
                    )
                  }
                >
                  <UserPlus className="size-3.5" aria-hidden />
                  Assign to me
                </Button>

                <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Reassign
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reassign this ticket</DialogTitle>
                      <DialogDescription>
                        Requires the SUPPORT_LEAD role — an agent moving a ticket off of a colleague, over
                        their head. Enter the target agent&apos;s user id.
                      </DialogDescription>
                    </DialogHeader>
                    <Input
                      placeholder="Agent user id"
                      value={reassignAgentId}
                      onChange={(event) => setReassignAgentId(event.target.value)}
                    />
                    <DialogFooter>
                      <Button
                        disabled={!reassignAgentId || reassign.isPending}
                        onClick={() =>
                          reassign.mutate(
                            { ticketId, agentId: reassignAgentId },
                            {
                              onSuccess: () => {
                                showToast({ title: 'Reassigned', type: 'success' });
                                setReassignOpen(false);
                                setReassignAgentId('');
                              },
                              onError: onError('Could not reassign this ticket'),
                            },
                          )
                        }
                      >
                        Reassign
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      disabled={TERMINAL_STATUSES.has(data.ticket.status)}
                    >
                      Resolve
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Resolve this ticket</DialogTitle>
                      <DialogDescription>
                        The customer can reopen it for 14 days after this. Past that, a new ticket
                        referencing this one is the right move.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="Resolution summary (optional, internal)"
                      value={resolveSummary}
                      onChange={(event) => setResolveSummary(event.target.value)}
                    />
                    <DialogFooter>
                      <Button
                        disabled={resolve.isPending}
                        onClick={() =>
                          resolve.mutate(
                            { ticketId, resolutionSummary: resolveSummary || undefined },
                            {
                              onSuccess: () => {
                                showToast({ title: 'Ticket resolved', type: 'success' });
                                setResolveOpen(false);
                                setResolveSummary('');
                              },
                              onError: onError('Could not resolve this ticket'),
                            },
                          )
                        }
                      >
                        Resolve
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Gavel className="size-3.5" aria-hidden />
                      Escalate to dispute
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Escalate to a dispute</DialogTitle>
                      <DialogDescription>
                        Use this only when the ticket turns out to be a financial claim, not a support
                        question. Disputes (M3) does not exist yet — this records the escalation intent
                        (status change, audit entry, event) and moves the ticket to WAITING_INTERNAL. It
                        does NOT open a real dispute case yet; that happens automatically once M3 ships and
                        reconciles this intent.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="Why is this a financial claim, not a support issue?"
                      value={escalateReason}
                      onChange={(event) => setEscalateReason(event.target.value)}
                    />
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        disabled={escalateReason.trim().length < 3 || escalate.isPending}
                        onClick={() =>
                          escalate.mutate(
                            { ticketId, reason: escalateReason },
                            {
                              onSuccess: () => {
                                showToast({
                                  title: 'Escalation recorded',
                                  description: 'The ticket is now WAITING_INTERNAL, pending Disputes (M3).',
                                  type: 'success',
                                });
                                setEscalateOpen(false);
                                setEscalateReason('');
                              },
                              onError: onError('Could not escalate this ticket'),
                            },
                          )
                        }
                      >
                        Escalate
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {data.escalations.length > 0 && (
              <Card className="border-komtru-risk/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <ShieldAlert className="text-komtru-risk size-4" aria-hidden />
                    Dispute escalation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {data.escalations.map((escalation) => (
                    <div key={escalation.id} className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground text-xs">{escalation.reason}</span>
                      <span className="trade-code text-xs font-semibold">
                        {escalation.status === 'PENDING_M3'
                          ? 'Pending Disputes (M3)'
                          : `Linked — dispute ${escalation.disputeId}`}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="customer">
              <TabsList>
                <TabsTrigger value="customer">
                  <MessageSquare className="size-3.5" aria-hidden />
                  Customer conversation ({data.customerVisibleMessages.length})
                </TabsTrigger>
                <TabsTrigger value="internal">
                  <ShieldAlert className="size-3.5" aria-hidden />
                  Internal notes ({data.internalNotes.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="customer" className="space-y-3">
                <div className="space-y-2">
                  {data.customerVisibleMessages.map((message) => (
                    <MessageBubble key={message.id} message={message} tone="customer" />
                  ))}
                </div>

                {!TERMINAL_STATUSES.has(data.ticket.status) && (
                  <div className="space-y-2 rounded-lg border p-3">
                    <Textarea
                      placeholder="Reply to the customer — this is visible to them."
                      value={externalReply}
                      onChange={(event) => setExternalReply(event.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        disabled={!externalReply.trim() || replyExternal.isPending}
                        onClick={() =>
                          replyExternal.mutate(
                            { ticketId, body: externalReply },
                            {
                              onSuccess: () => {
                                setExternalReply('');
                              },
                              onError: onError('Could not send this reply'),
                            },
                          )
                        }
                      >
                        Send to customer
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="internal" className="space-y-3">
                <p className="text-komtru-warning-on-soft bg-komtru-warning-soft dark:bg-komtru-warning/10 dark:text-komtru-warning rounded-md p-2 text-xs">
                  Internal notes are staff-only and never reach the customer surface.
                </p>
                <div className="space-y-2">
                  {data.internalNotes.map((message) => (
                    <MessageBubble key={message.id} message={message} tone="internal" />
                  ))}
                </div>

                {!TERMINAL_STATUSES.has(data.ticket.status) && (
                  <div className="space-y-2 rounded-lg border p-3">
                    <Textarea
                      placeholder="Add an internal note — colleagues only."
                      value={internalNote}
                      onChange={(event) => setInternalNote(event.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!internalNote.trim() || replyInternal.isPending}
                        onClick={() =>
                          replyInternal.mutate(
                            { ticketId, body: internalNote },
                            {
                              onSuccess: () => {
                                setInternalNote('');
                              },
                              onError: onError('Could not add this note'),
                            },
                          )
                        }
                      >
                        Add internal note
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
