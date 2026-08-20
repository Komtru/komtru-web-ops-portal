'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { KomtruMark } from '@/components/general/komtru-mark';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { MENU, type MenuItem } from '@/config/menu';
import { useSidebarStore } from '@/store/sidebar.store';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  /**
   * Counts surfaced next to nav items, keyed by a menu item's `badgeKey`.
   * Modules supply these as they land.
   */
  badges?: Record<string, number | undefined>;
}

/**
 * Matches on pathname, and on `?status=` when a menu entry points at a filtered
 * view of the same page, so sibling filter links don't all highlight at once.
 */
function useIsActive() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status');

  return function isActive(href: string) {
    const [path, query] = href.split('?');
    if (pathname !== path) return false;

    const hrefStatus = query ? new URLSearchParams(query).get('status') : null;
    return hrefStatus === currentStatus;
  };
}

export function AppSidebar({ badges }: AppSidebarProps) {
  const isActive = useIsActive();
  const { openSections, toggleSection } = useSidebarStore();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-sidebar-border border-b px-4 py-4">
        <Link href="/dashboard" className="font-display flex items-center gap-2 font-semibold">
          <KomtruMark className="text-komtru-cyan" size={20} />
          <span className="group-data-[collapsible=icon]:hidden">Komtru</span>
        </Link>
        <p className="text-sidebar-foreground/55 text-[10.5px] tracking-[0.08em] uppercase group-data-[collapsible=icon]:hidden">
          Operations
        </p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Control room</SidebarGroupLabel>
          <SidebarMenu>
            {MENU.map((section) => {
              if (!section.items?.length) {
                return (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={section.href ? isActive(section.href) : false}
                      tooltip={section.label}
                    >
                      <Link href={section.href ?? '#'}>
                        <section.icon aria-hidden />
                        <span>{section.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              const isOpen = openSections.includes(section.id);

              return (
                <Collapsible
                  key={section.id}
                  open={isOpen}
                  onOpenChange={() => toggleSection(section.id)}
                  className="group/collapsible"
                  asChild
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={section.label}>
                        <section.icon aria-hidden />
                        <span>{section.label}</span>
                        <ChevronRight
                          className={cn(
                            'ml-auto transition-transform duration-200',
                            isOpen && 'rotate-90',
                          )}
                          aria-hidden
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {section.items.map((item: MenuItem) => {
                          const badge = item.badgeKey ? badges?.[item.badgeKey] : undefined;

                          return (
                            <SidebarMenuSubItem key={item.id}>
                              <SidebarMenuSubButton asChild isActive={isActive(item.href)}>
                                <Link href={item.href}>
                                  <span>{item.label}</span>
                                  {badge ? (
                                    <span className="bg-komtru-gold/20 text-komtru-gold-soft ml-auto rounded-full px-1.5 text-[10px] font-semibold">
                                      {badge}
                                    </span>
                                  ) : null}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t px-4 py-3">
        <p className="text-sidebar-foreground/55 text-[10.5px] leading-relaxed group-data-[collapsible=icon]:hidden">
          Internal operations console.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
