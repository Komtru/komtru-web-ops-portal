import {
  ArrowLeftRight,
  BadgeCheck,
  Gavel,
  Landmark,
  LayoutDashboard,
  ScrollText,
  ShieldAlert,
  Users,
  Vault,
  type LucideIcon,
} from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  /** Rendered as a count/attention pill when the value resolves. */
  badgeKey?: string;
}

export interface MenuSection {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Leaf entry. Mutually exclusive with `items`. */
  href?: string;
  /** Collapsible group. */
  items?: MenuItem[];
}

/**
 * Operator navigation.
 *
 * One entry for now — module sections get added here as they are built, either
 * as a leaf (`href`) or as a collapsible group (`items`); the sidebar renders
 * both shapes already.
 *
 * Access rules are not modelled: the account model (roles/permissions) is still
 * undefined, so every operator sees every entry. When roles land, filter this
 * list once at the layout boundary rather than scattering checks through the
 * sidebar.
 */
export const MENU: MenuSection[] = [
  {
    id: 'overview',
    label: 'Command center',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'directory',
    label: 'Directory',
    icon: Users,
    href: '/directory',
  },
  {
    id: 'trades',
    label: 'Trades & Lifecycle',
    icon: ArrowLeftRight,
    href: '/trades',
  },
  {
    id: 'disputes',
    label: 'Disputes',
    icon: Gavel,
    href: '/disputes',
  },
  {
    id: 'kyc-and-verifications',
    label: 'KYC & Verifications',
    icon: BadgeCheck,
    href: '/kyc-and-verifications',
  },
  {
    id: 'escrow',
    label: 'Escrow & Protection',
    icon: Vault,
    href: '/escrow-and-protection',
  },
  {
    id: 'settlements-and-ledger',
    label: 'Settlements & Ledger',
    icon: Landmark,
    href: '/settlements-and-ledger',
  },
  {
    id: 'risk-and-safety',
    label: 'Risk & Safety',
    icon: ShieldAlert,
    href: '/risk-and-safety',
  },
  {
    id: 'audit-trail',
    label: 'Audit Trail',
    icon: ScrollText,
    href: '/audit-trail',
  },
];
