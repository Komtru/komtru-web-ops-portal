'use client';

import {
  AlertTriangle,
  Building2,
  Clock,
  Layers,
  Lock,
  TrendingUp,
  UserRoundCheck,
  Users,
} from 'lucide-react';

import type { CommandCenterSnapshot, SnapshotSource } from '@/interfaces/command-center';
import {
  DisputeQueuePanel,
  OperatorActionsPanel,
  RegistrationsPanel,
  SubModulesPanel,
} from '@/app/(dashboard)/dashboard/CommandCenterPanels';
import { StatCard, type StatAccent } from '@/app/(dashboard)/dashboard/StatCard';
import { QueryState } from '@/components/general/query-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useSocket } from '@/components/realtime/socket-provider';
import {
  formatDateTime,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
} from '@/helpers/format';
import { cn } from '@/lib/utils';
import { useCommandCenter } from '@/services/command-center.services';

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * States whether the numbers below are real.
 *
 * Three cases, because they mean three different things to an operator: the
 * snapshot is a fixture; the snapshot is live but pushes are not arriving, so
 * it will go stale; or everything is working. Collapsing the middle case into
 * either neighbour is how a frozen dashboard passes for a live one.
 */
function LiveStatusPill({ source, connected }: { source: SnapshotSource; connected: boolean }) {
  const { label, tone } =
    source === 'sample'
      ? { label: 'Sample data — API not connected', tone: 'warning' as const }
      : connected
        ? { label: 'Live ecosystem connected', tone: 'success' as const }
        : { label: 'Live data — realtime offline', tone: 'neutral' as const };

  return (
    <span
      className={cn(
        'trade-code inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium',
        tone === 'success' &&
          'bg-komtru-success-soft text-komtru-success-on-soft dark:bg-komtru-success/15 dark:text-komtru-success',
        tone === 'warning' &&
          'bg-komtru-warning-soft text-komtru-warning-on-soft dark:bg-komtru-warning/15 dark:text-komtru-warning',
        tone === 'neutral' &&
          'bg-komtru-slate-100 text-komtru-slate-600 dark:bg-komtru-slate-800 dark:text-komtru-slate-300',
      )}
      role="status"
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          tone === 'success' && 'bg-komtru-success animate-pulse',
          tone === 'warning' && 'bg-komtru-warning',
          tone === 'neutral' && 'bg-komtru-slate-400',
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}

function CommandCenterHeader({
  snapshot,
  source,
  connected,
}: {
  snapshot: CommandCenterSnapshot;
  source: SnapshotSource;
  connected: boolean;
}) {
  const { custody } = snapshot;

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">TrustOps Command Center</h1>
          <LiveStatusPill source={source} connected={connected} />
        </div>
        <p className="text-muted-foreground text-[12.5px] leading-relaxed">
          Operational visibility, platform-wide user accounting, escrow protection custody &amp;
          dispute adjudication.
        </p>
        <p className="text-muted-foreground trade-code text-[11px]">
          Snapshot taken {formatDateTime(snapshot.generatedAt)}
        </p>
      </div>

      {/* The two figures an operator is accountable for, so they stay next to
          the title rather than scrolling away with the grid below. */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Active escrow in custody"
          value={formatMoney(custody.activeEscrowMinor, custody.currency)}
          caption="Held across open trades"
          icon={Lock}
          accent="success"
          href="/escrow-and-protection?status=HELD"
        />
        <StatCard
          label="Open adjudications"
          value={`${formatNumber(custody.openAdjudications)} ${
            custody.openAdjudications === 1 ? 'Case' : 'Cases'
          }`}
          caption="Awaiting a ruling"
          icon={AlertTriangle}
          accent={custody.openAdjudications > 0 ? 'warning' : 'neutral'}
          href="/disputes?status=AWAITING_REVIEW"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat grids                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Every card's destination, filter included.
 *
 * Built as data rather than inline JSX so the mapping from figure to filtered
 * view is readable in one place — and so it is obvious when a card links
 * somewhere that cannot possibly reproduce its own number. The filter keys come
 * from the contract's unions (`accountType`, `status`, `state`); `?status=` in
 * particular matches what `useIsActive` in the sidebar already keys off, so a
 * card and a future filtered nav entry highlight consistently.
 */
function userCards(snapshot: CommandCenterSnapshot) {
  const { users } = snapshot;

  return [
    {
      label: 'Total platform users',
      value: formatNumber(users.totalUsers),
      caption: 'Shared account schema',
      icon: Users,
      accent: 'neutral' as StatAccent,
      href: '/directory',
    },
    {
      label: 'Total buyers',
      value: formatNumber(users.totalBuyers),
      caption: 'Direct consumer accounts',
      icon: UserRoundCheck,
      accent: 'success' as StatAccent,
      href: '/directory?accountType=BUYER',
    },
    {
      label: 'Total sellers',
      value: formatNumber(users.totalSellers),
      caption: 'Individual / social merchants',
      icon: Users,
      accent: 'info' as StatAccent,
      href: '/directory?accountType=SELLER',
    },
    {
      label: 'Total merchants',
      value: formatNumber(users.totalMerchants),
      caption: 'Registered CAC enterprises',
      icon: Building2,
      accent: 'info' as StatAccent,
      href: '/directory?accountType=MERCHANT',
    },
    {
      label: 'Pending verification',
      value: formatNumber(users.pendingVerification),
      caption: 'Requires review',
      icon: Clock,
      accent: 'warning' as StatAccent,
      // The KYC module owns the queue, so this leaves the directory entirely
      // rather than filtering it to accounts that happen to be unverified.
      href: '/kyc-and-verifications?status=PENDING',
    },
    {
      label: 'Restricted users',
      value: formatNumber(users.restrictedUsers),
      caption: 'Compliance locked',
      icon: AlertTriangle,
      accent: 'risk' as StatAccent,
      href: '/directory?status=RESTRICTED',
    },
  ];
}

function operationsCards(snapshot: CommandCenterSnapshot) {
  const { operations } = snapshot;

  return [
    {
      label: 'Platform fulfilment rate',
      value: formatPercent(operations.fulfilmentRate),
      caption: 'Flawless trade completions',
      icon: TrendingUp,
      accent: 'success' as StatAccent,
      href: '/trades?state=SETTLED',
    },
    {
      label: 'Active ecosystem trades',
      value: formatNumber(operations.activeTrades),
      caption: 'In lifecycle progression',
      icon: Layers,
      accent: 'info' as StatAccent,
      // No single state reproduces this figure — it spans the six mid-lifecycle
      // states in `ACTIVE_TRADE_STATES` — so the filter names the group.
      href: '/trades?state=ACTIVE',
    },
    {
      label: 'Protected in escrow',
      value: formatMoneyCompact(operations.protectedInEscrowMinor, operations.currency),
      caption: 'Locked in settlement vault',
      icon: Lock,
      accent: 'info' as StatAccent,
      href: '/escrow-and-protection?status=HELD',
    },
    {
      label: 'Active risk alerts',
      value: formatNumber(operations.activeRiskAlerts),
      caption: 'Rules & SLA thresholds',
      icon: AlertTriangle,
      accent: 'warning' as StatAccent,
      href: '/risk-and-safety?status=OPEN',
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* View                                                                       */
/* -------------------------------------------------------------------------- */

function CommandCenterSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-80" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export function CommandCenterView() {
  const { data, isLoading, error, refetch } = useCommandCenter();
  const { connected } = useSocket();

  /**
   * `error` is near-unreachable — `fetchCommandCenter` resolves with the
   * fixture rather than rejecting — but it is handled rather than assumed away,
   * since a future change to that fallback shouldn't silently blank the page.
   */
  if (error && !data) {
    return (
      <QueryState isLoading={false} error={error} onRetry={() => void refetch()}>
        {null}
      </QueryState>
    );
  }

  // Rendered directly, not through `QueryState`: its loading branch is a
  // centred spinner, and this page has enough structure to show its shape.
  if (isLoading || !data) return <CommandCenterSkeleton />;

  const { snapshot, source } = data;

  return (
    <div className="space-y-6">
      <CommandCenterHeader snapshot={snapshot} source={source} connected={connected} />

      <section className="space-y-3" aria-labelledby="user-accounting">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="user-accounting"
            className="text-komtru-slate-600 dark:text-komtru-slate-300 flex items-center gap-2 text-[12px] font-semibold tracking-[0.07em] uppercase"
          >
            <Users className="size-4" aria-hidden />
            Ecosystem user accounting
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {userCards(snapshot).map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      <section aria-label="Operational health">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {operationsCards(snapshot).map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <DisputeQueuePanel entries={snapshot.disputeQueue} total={snapshot.disputeQueueTotal} />
          <RegistrationsPanel entries={snapshot.registrations} />
        </div>

        <div className="space-y-4">
          <SubModulesPanel snapshot={snapshot} />
          <OperatorActionsPanel actions={snapshot.operatorActions} />
        </div>
      </div>
    </div>
  );
}
