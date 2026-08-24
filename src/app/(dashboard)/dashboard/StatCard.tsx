import { ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

/**
 * Which semantic the figure carries. Maps to the brand tokens in `globals.css`
 * — never a raw hex, and never a bare Tailwind palette colour.
 */
export type StatAccent = 'neutral' | 'success' | 'info' | 'warning' | 'risk';

const ACCENT_LABEL: Record<StatAccent, string> = {
  neutral: 'text-komtru-slate-600 dark:text-komtru-slate-300',
  success: 'text-komtru-success-on-soft dark:text-komtru-success',
  info: 'text-komtru-info-on-soft dark:text-komtru-info',
  warning: 'text-komtru-warning-on-soft dark:text-komtru-warning',
  risk: 'text-komtru-risk-on-soft dark:text-komtru-risk',
};

/**
 * Hover treatment, tinted per accent so a risk card doesn't glow indigo.
 *
 * Border and background only. The lift and the chevron are shared, below.
 */
const ACCENT_HOVER: Record<StatAccent, string> = {
  neutral: 'hover:border-komtru-slate-300 hover:bg-komtru-slate-50 dark:hover:bg-komtru-slate-800',
  success:
    'hover:border-komtru-success/45 hover:bg-komtru-success-soft/60 dark:hover:bg-komtru-success/10',
  info: 'hover:border-komtru-info/45 hover:bg-komtru-info-soft/60 dark:hover:bg-komtru-info/10',
  warning:
    'hover:border-komtru-warning/45 hover:bg-komtru-warning-soft/60 dark:hover:bg-komtru-warning/10',
  risk: 'hover:border-komtru-risk/45 hover:bg-komtru-risk-soft/60 dark:hover:bg-komtru-risk/10',
};

interface StatCardProps {
  label: string;
  /** Pre-formatted. Formatting belongs to the caller, which knows the units. */
  value: string;
  /** One line under the figure explaining what it counts. */
  caption: string;
  icon: LucideIcon;
  accent?: StatAccent;
  /**
   * Where the figure lives in full, filter included — e.g.
   * `/directory?accountType=MERCHANT`. The card is the link, so this is
   * required: a stat with nowhere to drill into should not be a `StatCard`.
   */
  href: string;
  /**
   * Overrides the accessible name. Use when `label` alone is ambiguous out of
   * context — the link text an operator hears is "<label>, <value>" otherwise.
   */
  ariaLabel?: string;
  className?: string;
}

/**
 * One figure on the command centre, and the way into the module that owns it.
 *
 * The whole card is a single `Link` rather than a div with a button in it: it
 * gives keyboard focus, middle-click, and open-in-new-tab for free, and there
 * is exactly one thing a card can do. Focus styling comes from the global
 * `:focus-visible` rule in `globals.css`, so it matches every other control.
 */
export function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  accent = 'neutral',
  href,
  ariaLabel,
  className,
}: StatCardProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? `${label}: ${value}`}
      className={cn(
        'group bg-card flex flex-col justify-between gap-2.5 rounded-xl border p-3.5 shadow-sm',
        // Transform and shadow are transitioned alongside colour so the lift
        // doesn't snap while the tint fades.
        'transition-[color,background-color,border-color,box-shadow,transform] duration-200',
        'hover:-translate-y-px hover:shadow-md',
        ACCENT_HOVER[accent],
        className,
      )}
    >
      {/* `min-w-0` on the row and `truncate` on the text below: with six cards
          across, nothing here is allowed to wrap to a second line, which means
          overflow has to go somewhere. An ellipsis is the safe direction — a
          bare `whitespace-nowrap` would push the chevron out of the card. */}
      <div className="flex min-w-0 items-center justify-between gap-1.5">
        <span
          className={cn(
            'flex min-w-0 items-center gap-1.5 text-[9.5px] font-semibold tracking-wider uppercase',
            ACCENT_LABEL[accent],
          )}
        >
          <Icon className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </span>

        {/* Sits in the layout at all times — animating opacity rather than
            mounting keeps the header from reflowing on hover. */}
        <ChevronRight
          className="text-muted-foreground size-3 shrink-0 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
          aria-hidden
        />
      </div>

      <div className="min-w-0 space-y-0.5">
        <p className="trade-code truncate text-[21px] leading-tight font-semibold">{value}</p>
        <p className={cn('truncate text-[10.5px]', ACCENT_LABEL[accent])}>{caption}</p>
      </div>
    </Link>
  );
}
