import { LayoutDashboard, type LucideIcon } from 'lucide-react';

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
    label: 'Overview',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'trades',
    label: 'Trades',
    icon: LayoutDashboard,
    items: [
      {
        id: 'trades-active',
        label: 'Active trades',
        href: '/trades/active',
      },
      {
        id: 'trades-all',
        label: 'All trades',
        href: '/trades',
      },
    ],
  },
];
