import type { ISODateString } from '@/interfaces/common';

/**
 * Contract for the command centre.
 *
 * ---------------------------------------------------------------------------
 * GET operations/command-center  ->  IResponse<CommandCenterSnapshot>
 * ---------------------------------------------------------------------------
 *
 * One request, one screen. The page is a read-only briefing assembled from six
 * subsystems (accounts, trades, escrow, disputes, risk, audit), and fanning it
 * out into six calls would mean six spinners and six ways to be half-loaded.
 * The server does the joining; the client renders whatever it is handed.
 *
 * Takes no parameters. Everything here is "as of now" — there is no date range
 * to scope, and adding one later is a new field, not a breaking change.
 *
 * Every count is also a link target: the stat cards navigate into the module
 * that owns the number, carrying the filter that reproduces it. That is why the
 * filter vocabularies below live in this file rather than in the components —
 * the card that writes `?accountType=MERCHANT` and the directory that later
 * reads it have to agree on the spelling, and this is the one place both import.
 *
 * The `(string & {})` unions are the house idiom (see `interfaces/auth.ts`):
 * the known members autocomplete, but an unrecognised value from the backend
 * widens instead of failing to compile.
 */

/* -------------------------------------------------------------------------- */
/* Filter vocabularies — shared with the module routes the cards link into     */
/* -------------------------------------------------------------------------- */

/** What kind of party an account is. Drives `/directory?accountType=`. */
export type AccountType = 'BUYER' | 'SELLER' | 'MERCHANT' | (string & {});

/** Account standing. Drives `/directory?status=`. */
export type AccountStatus = 'ACTIVE' | 'PENDING' | 'RESTRICTED' | 'CLOSED' | (string & {});

/** Where a KYC/KYB submission sits. Drives `/kyc-and-verifications?status=`. */
export type VerificationStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | (string & {});

/**
 * The nine-stage trade lifecycle. Drives `/trades?state=`.
 *
 * `DISPUTED` is deliberately absent: a dispute is an overlay on a trade that is
 * still somewhere in this progression, and it is carried by `adjudication` on
 * the queue entry instead. A trade in arbitration is still `IN_TRANSIT` or
 * `DELIVERED` — collapsing that would lose the state the settlement depends on.
 */
export type TradeLifecycleState =
  | 'CREATED'
  | 'AWAITING_PAYMENT'
  | 'FUNDED'
  | 'AWAITING_DISPATCH'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'INSPECTION'
  | 'SETTLED'
  | 'CANCELLED'
  | (string & {});

/** Trades counted as "in lifecycle progression" by `activeTrades`. */
export const ACTIVE_TRADE_STATES: readonly TradeLifecycleState[] = [
  'AWAITING_PAYMENT',
  'FUNDED',
  'AWAITING_DISPATCH',
  'IN_TRANSIT',
  'DELIVERED',
  'INSPECTION',
];

/** Where an adjudication sits. Drives `/disputes?status=`. */
export type AdjudicationStatus =
  'AWAITING_REVIEW' | 'EVIDENCE_REQUESTED' | 'IN_ARBITRATION' | 'RESOLVED' | (string & {});

/** Whether escrow is still held. Drives `/escrow-and-protection?status=`. */
export type CustodyStatus = 'HELD' | 'RELEASED' | 'REFUNDED' | (string & {});

/** Risk alert standing. Drives `/risk-and-safety?status=`. */
export type RiskAlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'CLEARED' | (string & {});

/* -------------------------------------------------------------------------- */
/* Snapshot sections                                                          */
/* -------------------------------------------------------------------------- */

/**
 * The two figures pinned to the page header.
 *
 * Split out from `operations` below because these are the pair an operator is
 * accountable for at a glance — how much of other people's money is being held,
 * and how many decisions are outstanding.
 */
export interface CustodySummary {
  /** Minor units (kobo for NGN) — see `helpers/format.ts`. Never pre-formatted. */
  activeEscrowMinor: number;
  currency: string;
  /** Adjudications an operator still has to rule on. */
  openAdjudications: number;
}

/** Headcount across the shared account schema. */
export interface UserAccounting {
  totalUsers: number;
  totalBuyers: number;
  totalSellers: number;
  totalMerchants: number;
  /** Submitted KYC/KYB awaiting an operator. */
  pendingVerification: number;
  /** Accounts a compliance action has locked. */
  restrictedUsers: number;
}

/** Platform-wide operational health. */
export interface OperationsSummary {
  /**
   * Completed-without-dispute over all concluded trades, as a fraction in
   * `0..1` — not a percentage. Formatting is the UI's job (`formatPercent`).
   */
  fulfilmentRate: number;
  /** Trades in one of `ACTIVE_TRADE_STATES`. */
  activeTrades: number;
  /** Minor units currently locked in the settlement vault. */
  protectedInEscrowMinor: number;
  currency: string;
  /** Risk rules and SLA thresholds currently tripped. */
  activeRiskAlerts: number;
}

/** A trade waiting on an operator decision. */
export interface DisputeQueueEntry {
  id: string;
  /** Operator-facing reference, e.g. `KMT-88301`. */
  tradeCode: string;
  buyerName: string;
  sellerName: string;
  /** What is being traded, short enough for one line. */
  itemSummary: string;
  protectedAmountMinor: number;
  currency: string;
  lifecycleState: TradeLifecycleState;
  adjudication: AdjudicationStatus;
  openedAt: ISODateString;
}

/** A recent onboarding. */
export interface PlatformRegistration {
  id: string;
  displayName: string;
  accountType: AccountType;
  /** CAC-registered entity name. Absent for individuals. */
  legalName?: string;
  email: string;
  phone: string;
  /** Free text as supplied at onboarding, e.g. `Lekki Phase 1, Lagos`. */
  location: string;
  status: AccountStatus;
  joinedAt: ISODateString;
}

/** One entry from the immutable audit trail. */
export interface OperatorAction {
  id: string;
  /** Short label for what was done, e.g. `KYB Approved`. */
  title: string;
  /** Prose detail, already assembled server-side. */
  detail: string;
  actorName: string;
  /** Operator role slug, e.g. `super_admin`, `trust_safety`. */
  actorRole: string;
  /** The account or trade acted on, e.g. `USR-2001`. */
  targetRef: string;
  occurredAt: ISODateString;
}

/** Everything the command centre renders. */
export interface CommandCenterSnapshot {
  /** When the server assembled this. Drives the staleness note in the header. */
  generatedAt: ISODateString;
  custody: CustodySummary;
  users: UserAccounting;
  operations: OperationsSummary;
  /** Highest-priority entries only — `disputeQueueTotal` is the full count. */
  disputeQueue: DisputeQueueEntry[];
  disputeQueueTotal: number;
  /** Most recent onboardings, newest first. */
  registrations: PlatformRegistration[];
  /** Most recent audit entries, newest first. */
  operatorActions: OperatorAction[];
}

/**
 * Where a rendered snapshot came from.
 *
 * The UI states this rather than hiding it. A fallback that looks identical to
 * live data is how an operator ends up releasing real escrow against numbers
 * that were never fetched.
 */
export type SnapshotSource = 'live' | 'sample';

export interface CommandCenterResult {
  snapshot: CommandCenterSnapshot;
  source: SnapshotSource;
  /** Why the fallback was used. Present only when `source` is `sample`. */
  fallbackReason?: string;
}
