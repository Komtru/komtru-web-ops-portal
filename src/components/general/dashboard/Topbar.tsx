'use client';

import { Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { initialsOf } from '@/helpers/format';
import { useAuthStore } from '@/store/auth.store';

interface TopbarProps {
  /** Unread operational alerts. Modules supply this once they exist. */
  alertCount?: number;
}

export function Topbar({ alertCount = 0 }: TopbarProps) {
  const { resolvedTheme, setTheme } = useTheme();

  const user = useAuthStore((state) => state.user);
  const organization = useAuthStore((state) => state.organization);
  const hydrated = useAuthStore((state) => state.hydrated);

  return (
    <header className="bg-background/80 border-border sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 !h-5" />

      <div className="ml-auto flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <Sun className="size-4 dark:hidden" aria-hidden />
              <Moon className="hidden size-4 dark:block" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative" aria-label="Alerts">
              <Bell className="size-4" aria-hidden />
              {alertCount > 0 ? (
                <span className="bg-komtru-risk absolute top-1 right-1 size-1.5 rounded-full" />
              ) : null}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {alertCount > 0 ? `${alertCount} need attention` : 'Nothing needs attention'}
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 !h-5" />

        {/* Gated on `hydrated`: reading persisted state during SSR would mismatch. */}
        <div className="flex items-center gap-2.5">
          <span className="bg-komtru-blue-soft text-komtru-info-on-soft dark:bg-komtru-blue/25 dark:text-komtru-slate-100 flex size-8 items-center justify-center rounded-full text-[11px] font-semibold">
            {hydrated ? initialsOf(user?.firstName, user?.lastName) : '··'}
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[12.5px] font-semibold">
              {hydrated && user ? `${user.firstName} ${user.lastName}` : 'Signed out'}
            </span>
            <span className="text-muted-foreground block text-[11px]">
              {hydrated && organization ? organization.name : 'No organization'}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
