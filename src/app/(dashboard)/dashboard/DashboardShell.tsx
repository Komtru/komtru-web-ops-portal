'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

import { AppSidebar } from '@/components/general/dashboard/Sidebar';
import { Topbar } from '@/components/general/dashboard/Topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * Client half of the dashboard layout: sidebar + topbar chrome and the animated
 * content surface. Module pages render into the rounded card.
 *
 * Route protection deliberately lives nowhere yet — the account model isn't
 * defined, so there is nothing truthful to gate on. `middleware.ts` stays a
 * pass-through for the same reason.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={200}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-komtru-slate-100 dark:bg-komtru-navy">
          <Topbar />
          <main className="flex-1 p-4 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="bg-card border-border min-h-[calc(100vh-7rem)] rounded-2xl border p-4 shadow-sm md:p-6"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
