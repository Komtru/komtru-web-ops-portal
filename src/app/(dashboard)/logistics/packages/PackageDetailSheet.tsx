'use client';

import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Box,
  Send,
  AlertTriangle,
  History,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { QueryState } from '@/components/general/query-state';
import { formatDateTime } from '@/helpers/format';
import { useLogisticsPackageDetail } from '@/services/logistics.services';
import type { LogisticsPackageStatus } from '@/interfaces/logistics';

interface PackageDetailSheetProps {
  packageId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function statusBadgeVariant(
  status: LogisticsPackageStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'DELIVERED':
      return 'default';
    case 'SHIPPED':
    case 'PACKAGED':
    case 'PICKED_UP':
    case 'ACCEPTED':
      return 'secondary';
    case 'REJECTED':
      return 'destructive';
    case 'REQUESTED':
    default:
      return 'outline';
  }
}

function statusIcon(status: LogisticsPackageStatus) {
  switch (status) {
    case 'REQUESTED':
      return <Clock className="size-3.5 text-amber-500" />;
    case 'ACCEPTED':
      return <CheckCircle2 className="size-3.5 text-blue-500" />;
    case 'PICKED_UP':
      return <Truck className="size-3.5 text-indigo-500" />;
    case 'PACKAGED':
      return <Box className="size-3.5 text-purple-500" />;
    case 'SHIPPED':
      return <Send className="size-3.5 text-cyan-500" />;
    case 'DELIVERED':
      return <CheckCircle2 className="size-3.5 text-emerald-500" />;
    case 'REJECTED':
      return <XCircle className="size-3.5 text-destructive" />;
  }
}

export function PackageDetailSheet({ packageId, open, onOpenChange }: PackageDetailSheetProps) {
  const { data: pkg, isLoading, error, refetch } = useLogisticsPackageDetail(packageId ?? undefined);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-2">
            <Package className="size-5 text-muted-foreground" />
            <SheetTitle>Shipment Detail</SheetTitle>
          </div>
          <SheetDescription>
            Lifecycle status, carrier assignment, and transition audit history.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <QueryState
            isLoading={isLoading}
            error={error}
            isEmpty={!pkg}
            onRetry={refetch}
            emptyTitle="Package not found"
            emptyDescription="Could not load package details."
          >
            {pkg && (
              <div className="space-y-6">
                {/* Status card */}
                <div className="rounded-lg border bg-card/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Current State</span>
                    <Badge variant={statusBadgeVariant(pkg.status)} className="gap-1.5 py-0.5">
                      {statusIcon(pkg.status)}
                      <span>{pkg.status}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Trade ID</span>
                      <span className="font-mono">{pkg.tradeId}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Courier Company ID</span>
                      <span className="font-mono">{pkg.companyId.slice(0, 8)}...</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Tracking Number</span>
                      <span className="font-mono font-medium">{pkg.trackingNumber ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Requested At</span>
                      <span>{formatDateTime(pkg.requestedAt)}</span>
                    </div>
                  </div>

                  {pkg.rejectionReason && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 mt-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-1">
                        <AlertTriangle className="size-3.5" />
                        Rejection Reason
                      </div>
                      <p className="text-xs text-foreground/90">{pkg.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Audit Timeline */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <History className="size-3.5" />
                    Transition Timeline
                  </div>

                  {pkg.events && pkg.events.length > 0 ? (
                    <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
                      {pkg.events.map((event, idx) => (
                        <div key={event.id} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-6 top-1 flex size-5 items-center justify-center rounded-full bg-background border border-border shadow-xs">
                            {statusIcon(event.toStatus)}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold">
                                {event.fromStatus ? `${event.fromStatus} → ` : ''}
                                {event.toStatus}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {formatDateTime(event.createdAt)}
                              </span>
                            </div>

                            {event.note && (
                              <p className="text-xs text-muted-foreground bg-secondary/40 rounded p-2">
                                {event.note}
                              </p>
                            )}

                            {event.actorUserId && (
                              <div className="text-[10px] text-muted-foreground/70 font-mono">
                                Actor: {event.actorUserId}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No transition events recorded.</p>
                  )}
                </div>
              </div>
            )}
          </QueryState>
        </div>
      </SheetContent>
    </Sheet>
  );
}
