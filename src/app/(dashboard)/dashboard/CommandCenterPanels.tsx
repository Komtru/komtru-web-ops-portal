import {
  ArrowLeftRight,
  BadgeCheck,
  ChevronRight,
  ScrollText,
  ShieldAlert,
  ShieldQuestion,
  UserRoundCheck,
  Users,
  Vault,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import type {
  AccountStatus,
  AccountType,
  CommandCenterSnapshot,
  DisputeQueueEntry,
  OperatorAction,
  PlatformRegistration,
  TradeLifecycleState,
} from '@/interfaces/command-center';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatRelative,
  initialsOf,
} from '@/helpers/format';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                */
/* -------------------------------------------------------------------------- */

/** A panel heading with an optional link out to the owning module. */
function PanelHeader({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <CardHeader className="gap-1">
      <CardTitle className="flex items-center gap-2 text-[14px]">
        <Icon className="text-komtru-risk size-4" aria-hidden />
        {title}
      </CardTitle>
      <CardDescription className="text-[12px] leading-relaxed">{description}</CardDescription>

      {actionHref ? (
        <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
          <Button variant="link" size="sm" className="h-auto p-0 text-[12.5px]" asChild>
            <Link href={actionHref}>
              {actionLabel}
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      ) : null}
    </CardHeader>
  );
}

/**
 * Turns an enum member into something readable — `IN_TRANSIT` -> `In transit`.
 *
 * Deliberately mechanical rather than a lookup table: the unions carry a
 * `(string & {})` escape hatch, so a state this build has never heard of still
 * renders as words instead of falling through to a blank cell.
 */
function humanizeEnum(value: string): string {
  const spaced = value.replace(/_/g, ' ').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Lifecycle states that should read as "attention needed" rather than neutral. */
const WATCHED_STATES: readonly TradeLifecycleState[] = ['IN_TRANSIT', 'INSPECTION', 'DELIVERED'];

function LifecyclePill({ state }: { state: TradeLifecycleState }) {
  const watched = WATCHED_STATES.includes(state);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap',
        watched
          ? 'bg-komtru-warning-soft text-komtru-warning-on-soft dark:bg-komtru-warning/15 dark:text-komtru-warning'
          : 'bg-komtru-slate-100 text-komtru-slate-600 dark:bg-komtru-slate-800 dark:text-komtru-slate-300',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          watched ? 'bg-komtru-warning' : 'bg-komtru-slate-400',
        )}
        aria-hidden
      />
      {humanizeEnum(state)}
    </span>
  );
}

const ACCOUNT_TYPE_STYLE: Record<string, string> = {
  BUYER:
    'bg-komtru-success-soft text-komtru-success-on-soft dark:bg-komtru-success/15 dark:text-komtru-success',
  SELLER:
    'bg-komtru-info-soft text-komtru-info-on-soft dark:bg-komtru-info/15 dark:text-komtru-info',
  MERCHANT:
    'bg-komtru-blue-soft text-komtru-info-on-soft dark:bg-komtru-blue/20 dark:text-komtru-slate-100',
};

function AccountTypePill({ type }: { type: AccountType }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[10px] font-bold tracking-[0.06em] uppercase',
        ACCOUNT_TYPE_STYLE[type] ??
          'bg-komtru-slate-100 text-komtru-slate-600 dark:bg-komtru-slate-800 dark:text-komtru-slate-300',
      )}
    >
      {type}
    </span>
  );
}

/**
 * Account standing. Uses the brand status tints rather than `Badge`'s `default`
 * variant, which is navy `bg-primary` — an active account should read green,
 * not as the primary action colour.
 */
const ACCOUNT_STATUS_STYLE: Record<string, string> = {
  ACTIVE:
    'bg-komtru-success-soft text-komtru-success-on-soft dark:bg-komtru-success/15 dark:text-komtru-success',
  PENDING:
    'bg-komtru-warning-soft text-komtru-warning-on-soft dark:bg-komtru-warning/15 dark:text-komtru-warning',
  RESTRICTED:
    'bg-komtru-risk-soft text-komtru-risk-on-soft dark:bg-komtru-risk/15 dark:text-komtru-risk',
};

function StatusBadge({ status }: { status: AccountStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'text-[10px] font-bold tracking-[0.06em] uppercase',
        ACCOUNT_STATUS_STYLE[status],
      )}
    >
      {status}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Priority dispute & escalation queue                                        */
/* -------------------------------------------------------------------------- */

/**
 * Column headings, in render order.
 *
 * Headings are `whitespace-nowrap` rather than truncated: the table already
 * sits in an `overflow-x-auto` wrapper with a `min-w-160` floor, so a heading
 * too wide for the viewport scrolls the table sideways instead of escaping the
 * card. Nothing gets clipped, and no heading drops to a second line — which is
 * the opposite trade-off from `StatCard`, where there is no scroll container to
 * absorb the overflow.
 */
const DISPUTE_COLUMNS: ReadonlyArray<{ label: string; align?: 'right' }> = [
  { label: 'Trade code' },
  { label: 'Counterparties' },
  { label: 'Protected amount' },
  { label: 'Lifecycle state' },
  { label: 'Adjudication', align: 'right' },
];

function DisputeRow({ entry }: { entry: DisputeQueueEntry }) {
  return (
    <tr className="border-border/60 border-b last:border-b-0">
      <td className="py-2.5 pr-4 align-middle">
        <span className="trade-code text-[11px] font-semibold whitespace-nowrap">
          {entry.tradeCode}
        </span>
      </td>

      <td className="py-2.5 pr-4 align-middle">
        {/* The only cell allowed to wrap. Two counterparty names plus the item
            can genuinely exceed any sane column width, and truncating a name
            mid-word is worse than a second line — the operator is reading this
            to identify the trade. */}
        <p className="text-[11.5px] font-semibold">
          {entry.buyerName} <span className="text-muted-foreground font-normal">↔</span>{' '}
          {entry.sellerName}
        </p>
        <p className="text-muted-foreground text-[10.5px]">{entry.itemSummary}</p>
      </td>

      <td className="py-2.5 pr-4 align-middle">
        <span className="trade-code text-komtru-success-on-soft dark:text-komtru-success text-[11px] font-semibold whitespace-nowrap">
          {formatMoney(entry.protectedAmountMinor, entry.currency)}
        </span>
      </td>

      <td className="py-2.5 pr-4 align-middle">
        <LifecyclePill state={entry.lifecycleState} />
      </td>

      <td className="py-2.5 text-right align-middle">
        {/* Links out rather than opening a modal: evidence review is the
            disputes module's job, and this row only knows which case to open.

            Carried as `?case=` rather than as a `/disputes/[id]` segment — that
            route does not exist yet, and a card that 404s is worse than one
            that lands on the module with the case named. Swap it for the path
            segment when the detail route ships. */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2.5 text-[11px] whitespace-nowrap"
          asChild
        >
          <Link href={`/disputes?case=${encodeURIComponent(entry.tradeCode)}`}>
            Inspect Evidence
            <ChevronRight className="size-3" aria-hidden />
          </Link>
        </Button>
      </td>
    </tr>
  );
}

export function DisputeQueuePanel({
  entries,
  total,
}: {
  entries: DisputeQueueEntry[];
  total: number;
}) {
  return (
    <Card>
      <PanelHeader
        icon={ShieldAlert}
        title="Priority Dispute & Escalation Queue"
        description="Trades requiring adjudicator review, evidence inspection, or binding settlement release."
        actionLabel={`View All (${formatNumber(total)})`}
        actionHref="/disputes?status=AWAITING_REVIEW"
      />

      <CardContent>
        {entries.length ? (
          <div className="overflow-x-auto">
            {/* Floor lowered alongside the type scale: at the old 640px the
                table would scroll sideways while the smaller content still had
                room to spare. */}
            <table className="w-full min-w-140 border-collapse text-left">
              <thead>
                <tr className="bg-komtru-slate-50 dark:bg-komtru-slate-800/60">
                  {DISPUTE_COLUMNS.map((column) => (
                    <th
                      key={column.label}
                      className={cn(
                        'text-muted-foreground py-2 text-[9.5px] font-semibold tracking-wider whitespace-nowrap uppercase',
                        column.align === 'right' ? 'pr-3 text-right' : 'pr-4 first:pl-3',
                      )}
                      scope="col"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <DisputeRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-border flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center">
            <ShieldQuestion className="text-muted-foreground size-5" aria-hidden />
            <p className="text-sm font-semibold">Nothing awaiting adjudication</p>
            <p className="text-muted-foreground text-xs">
              Escalated trades appear here the moment a counterparty files.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Live platform registrations                                                */
/* -------------------------------------------------------------------------- */

function RegistrationRow({ entry }: { entry: PlatformRegistration }) {
  return (
    <li className="border-border/60 flex items-center gap-3 border-b py-3 last:border-b-0">
      <span
        className="bg-komtru-navy text-komtru-slate-100 flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
        aria-hidden
      >
        {initialsOf(...entry.displayName.split(' '))}
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
          {entry.displayName}
          <AccountTypePill type={entry.accountType} />
          {entry.legalName ? (
            <span className="text-muted-foreground text-[12px] font-normal">
              ({entry.legalName})
            </span>
          ) : null}
        </p>
        <p className="trade-code text-muted-foreground truncate text-[11.5px]">
          {entry.email} • {entry.phone} • {entry.location}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusBadge status={entry.status} />
        <span className="text-muted-foreground text-[11.5px]">
          Joined {formatDate(entry.joinedAt)}
        </span>
      </div>
    </li>
  );
}

export function RegistrationsPanel({ entries }: { entries: PlatformRegistration[] }) {
  return (
    <Card>
      <PanelHeader
        icon={UserRoundCheck}
        title="Live Platform Registrations"
        description="Real-time onboarding feed across Buyers, Social Sellers, and Registered Merchants."
        actionLabel="Full Directory"
        actionHref="/directory"
      />

      <CardContent>
        <ul className="border-border rounded-xl border px-3">
          {entries.map((entry) => (
            <RegistrationRow key={entry.id} entry={entry} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Operational sub-modules                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The module rail.
 *
 * Kept separate from `config/menu.tsx` on purpose: the sidebar is navigation
 * (every module, always the same), while this rail is a briefing (a subset,
 * each labelled with the figure that makes it worth opening right now). Deriving
 * one from the other would force the sidebar to know about snapshot counts.
 */
function subModulesFor(snapshot: CommandCenterSnapshot) {
  const { users, custody, operations } = snapshot;

  return [
    {
      href: '/directory',
      icon: Users,
      title: 'User Directory & Restrictions',
      detail: `Manage ${formatNumber(users.totalUsers)} accounts, verify IDs, lock access`,
    },
    {
      href: '/trades',
      icon: ArrowLeftRight,
      title: 'Trade Lifecycle & State Overrides',
      detail: `${formatNumber(operations.activeTrades)} in progression across the 9-stage lifecycle`,
    },
    {
      href: '/escrow-and-protection?status=HELD',
      icon: Vault,
      title: 'Escrow & Protected Funds Vault',
      detail: `${formatMoney(custody.activeEscrowMinor, custody.currency)} in multi-party custody`,
    },
    {
      href: '/kyc-and-verifications?status=PENDING',
      icon: BadgeCheck,
      title: 'Corporate KYB & CAC Review',
      detail: `${formatNumber(users.pendingVerification)} awaiting enterprise verification`,
    },
    {
      href: '/risk-and-safety?status=OPEN',
      icon: ShieldAlert,
      title: 'Risk Monitoring & Rules',
      detail: `${formatNumber(operations.activeRiskAlerts)} high-value thresholds and SLA aging alerts`,
    },
    {
      href: '/audit-trail',
      icon: ScrollText,
      title: 'Immutable Audit Trail',
      detail: 'Logged operator interventions',
    },
  ];
}

export function SubModulesPanel({ snapshot }: { snapshot: CommandCenterSnapshot }) {
  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="text-[14px]">Operational Sub-Modules</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {subModulesFor(snapshot).map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="group border-border bg-komtru-slate-50/60 dark:bg-komtru-slate-800/40 hover:border-komtru-info/45 hover:bg-komtru-info-soft/60 dark:hover:bg-komtru-info/10 flex items-center gap-3 rounded-lg border p-3 transition-[background-color,border-color] duration-200"
          >
            <module.icon className="text-komtru-info size-4 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold">{module.title}</p>
              <p className="text-muted-foreground text-[11.5px] leading-relaxed">{module.detail}</p>
            </div>
            <ChevronRight
              className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Recent operator actions                                                    */
/* -------------------------------------------------------------------------- */

function ActionEntry({ action }: { action: OperatorAction }) {
  return (
    <li className="border-border bg-komtru-slate-50/60 dark:bg-komtru-slate-800/40 space-y-1.5 rounded-lg border p-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[12.5px] font-semibold">{action.title}</p>
        <span className="text-muted-foreground shrink-0 text-[11.5px]">
          {formatRelative(action.occurredAt)}
        </span>
      </div>

      <p className="text-muted-foreground text-[12px] leading-relaxed">{action.detail}</p>

      <div className="text-muted-foreground flex flex-wrap items-baseline justify-between gap-2 text-[11.5px]">
        <span className="trade-code">
          By: {action.actorName} ({action.actorRole})
        </span>
        <span className="trade-code">
          Target: <span className="text-foreground font-semibold">{action.targetRef}</span>
        </span>
      </div>
    </li>
  );
}

export function OperatorActionsPanel({ actions }: { actions: OperatorAction[] }) {
  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center gap-2 text-[14px]">
          <ScrollText className="text-komtru-info size-4" aria-hidden />
          Recent Operator Actions
        </CardTitle>
        <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
          <Button variant="link" size="sm" className="h-auto p-0 text-[12.5px]" asChild>
            <Link href="/audit-trail">Full Trail</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2">
          {actions.map((action) => (
            <ActionEntry key={action.id} action={action} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
