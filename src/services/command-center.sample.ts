import type { CommandCenterSnapshot } from '@/interfaces/command-center';

/**
 * Stand-in snapshot for when `operations/command-center` cannot be reached.
 *
 * The endpoint does not exist yet, so today this is what the page always
 * renders. It is a fixture, not a fallback strategy: once the API ships, this
 * only appears on a genuine outage, and the header says so either way.
 *
 * Two rules keep it useful:
 *
 *  - **Internally consistent.** The totals add up (4 + 3 + 3 = 10), the escrow
 *    figure in the header matches the vault figure below it, and
 *    `openAdjudications` equals `disputeQueueTotal`. Numbers that contradict
 *    each other train operators to distrust the screen.
 *  - **Shaped like production.** Money in minor units, timestamps as ISO
 *    strings, enum values from the contract's unions. Anything the real
 *    endpoint would send, this sends too, so plugging it in changes nothing.
 *
 * Timestamps are fixed rather than computed from `now`, so the fixture renders
 * identically on server and client and can't trip a hydration mismatch.
 */
export const COMMAND_CENTER_SAMPLE: CommandCenterSnapshot = {
  generatedAt: '2026-08-23T09:40:00.000Z',

  custody: {
    // ₦1,500,000.00 in kobo.
    activeEscrowMinor: 150_000_000,
    currency: 'NGN',
    openAdjudications: 1,
  },

  users: {
    totalUsers: 10,
    totalBuyers: 4,
    totalSellers: 3,
    totalMerchants: 3,
    pendingVerification: 2,
    restrictedUsers: 1,
  },

  operations: {
    // No trade has concluded yet, so the rate is genuinely zero rather than
    // absent. A settled trade would move it.
    fulfilmentRate: 0,
    activeTrades: 5,
    protectedInEscrowMinor: 150_000_000,
    currency: 'NGN',
    activeRiskAlerts: 2,
  },

  disputeQueue: [
    {
      id: 'dsp-1',
      tradeCode: 'KMT-88301',
      buyerName: 'Bola Olawale',
      sellerName: 'TechEdge NG',
      itemSummary: 'MacBook Air M2, 512GB',
      // ₦980,000.00 in kobo.
      protectedAmountMinor: 98_000_000,
      currency: 'NGN',
      lifecycleState: 'IN_TRANSIT',
      adjudication: 'AWAITING_REVIEW',
      openedAt: '2026-08-22T14:05:00.000Z',
    },
  ],
  disputeQueueTotal: 1,

  registrations: [
    {
      id: 'usr-2001',
      displayName: 'Amaka Balogun',
      accountType: 'BUYER',
      email: 'amaka@komtru.com',
      phone: '+234 803 456 7890',
      location: 'Lekki Phase 1, Lagos',
      status: 'ACTIVE',
      joinedAt: '2024-01-14T10:00:00.000Z',
    },
    {
      id: 'usr-2002',
      displayName: 'TechEdge NG',
      accountType: 'MERCHANT',
      legalName: 'TechEdge Technologies Ltd',
      email: 'sales@techedge.ng',
      phone: '+234 809 998 8877',
      location: 'Computer Village, Ikeja, Lagos',
      status: 'ACTIVE',
      joinedAt: '2022-03-22T10:00:00.000Z',
    },
    {
      id: 'usr-2003',
      displayName: 'Zaza Fashion',
      accountType: 'SELLER',
      legalName: 'Zaza Luxury Couture',
      email: 'orders@zazafashion.com',
      phone: '+234 818 776 5544',
      location: 'Victoria Island, Lagos',
      status: 'ACTIVE',
      joinedAt: '2023-06-10T10:00:00.000Z',
    },
    {
      id: 'usr-2004',
      displayName: 'Prime Gadgets',
      accountType: 'MERCHANT',
      legalName: 'Prime Devices Hub Ltd',
      email: 'hello@primegadgets.ng',
      phone: '+234 805 443 2211',
      location: 'Ikeja, Lagos',
      status: 'ACTIVE',
      joinedAt: '2021-11-05T10:00:00.000Z',
    },
    {
      id: 'usr-2005',
      displayName: 'Chidi Okonkwo',
      accountType: 'BUYER',
      email: 'chidi.o@gmail.com',
      phone: '+234 802 112 3344',
      location: 'Enugu, Enugu State',
      status: 'ACTIVE',
      joinedAt: '2024-02-18T10:00:00.000Z',
    },
  ],

  operatorActions: [
    {
      id: 'act-1',
      title: 'KYB Approved',
      detail: 'Approved Corporate CAC RC-1849204 for TechEdge NG. Upgraded to Tier 3.',
      actorName: 'Adeola Benson',
      actorRole: 'super_admin',
      targetRef: 'USR-2001',
      occurredAt: '2026-08-23T07:40:00.000Z',
    },
    {
      id: 'act-2',
      title: 'Account Restricted',
      detail:
        'Applied temporary settlement restriction on Emeka Solars following unresolved waybill discrepancy.',
      actorName: 'Farouk Ibrahim',
      actorRole: 'trust_safety',
      targetRef: 'USR-2005',
      occurredAt: '2026-08-23T04:40:00.000Z',
    },
    {
      id: 'act-3',
      title: 'Dispute Adjudication Scheduled',
      detail: 'Booked binding review for KMT-88301 after buyer submitted delivery evidence.',
      actorName: 'Adeola Benson',
      actorRole: 'super_admin',
      targetRef: 'KMT-88301',
      occurredAt: '2026-08-22T09:40:00.000Z',
    },
  ],
};
