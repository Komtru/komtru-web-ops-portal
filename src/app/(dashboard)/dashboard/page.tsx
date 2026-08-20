import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Overview',
};

/**
 * Placeholder overview. Kept deliberately empty — module pages and whatever
 * summary belongs here are built from their own specs.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Control room</h1>
      <p className="text-muted-foreground max-w-prose text-[12.5px] leading-relaxed">
        Shell is wired: sidebar, topbar, theming, query client, HTTP facade and session store are in
        place. Module pages mount under <code className="font-mono text-[11.5px]">/dashboard</code>{' '}
        and register their nav entries in{' '}
        <code className="font-mono text-[11.5px]">src/config/menu.tsx</code>.
      </p>
    </div>
  );
}
