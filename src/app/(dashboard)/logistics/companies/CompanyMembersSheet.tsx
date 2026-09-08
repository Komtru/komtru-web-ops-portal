'use client';

import { useState } from 'react';
import { Users2, Shield, User, Mail, Phone, Copy, Check, Clock, CalendarCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { QueryState } from '@/components/general/query-state';
import { formatDateTime } from '@/helpers/format';
import { useLogisticsCompanyMembers } from '@/services/logistics.services';
import type {
  LogisticsCompany,
  LogisticsMemberRole,
  LogisticsMemberStatus,
} from '@/interfaces/logistics';

interface CompanyMembersSheetProps {
  company: LogisticsCompany | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function roleVariant(role: LogisticsMemberRole) {
  return role === 'ADMIN' ? 'default' : 'secondary';
}

function statusVariant(
  status: LogisticsMemberStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'ACTIVE') return 'default';
  if (status === 'INVITED') return 'secondary';
  return 'destructive';
}

export function CompanyMembersSheet({ company, open, onOpenChange }: CompanyMembersSheetProps) {
  const { data, isLoading, error, refetch } = useLogisticsCompanyMembers(company?.id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b">
          <div className="flex items-center gap-2">
            <Users2 className="text-muted-foreground size-5" />
            <SheetTitle>{company?.name} — POC Roster</SheetTitle>
          </div>
          <SheetDescription>
            Authorized operators and administrators for this logistics partner.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4">
          <QueryState
            isLoading={isLoading}
            error={error}
            isEmpty={!data?.members || data.members.length === 0}
            onRetry={refetch}
            emptyTitle="No members found"
            emptyDescription="This company has no active or invited POC members."
          >
            <div className="divide-border divide-y">
              {data?.members.map((member) => {
                const user = member.user;
                const displayName = user?.displayName || 'Unnamed POC';
                const initials =
                  displayName
                    .split(' ')
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'PO';

                return (
                  <div key={member.id} className="space-y-3 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        {/* Avatar / Initial Circle */}
                        {user?.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={displayName}
                            className="size-10 shrink-0 rounded-full border object-cover"
                          />
                        ) : (
                          <div className="bg-secondary text-secondary-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                            {initials}
                          </div>
                        )}

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-foreground truncate text-sm font-semibold">
                              {displayName}
                            </span>
                            <Badge
                              variant={roleVariant(member.role)}
                              className="h-5 text-[10px] font-medium uppercase"
                            >
                              {member.role === 'ADMIN' ? (
                                <span className="flex items-center gap-1">
                                  <Shield className="size-3" /> Admin
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <User className="size-3" /> Operator
                                </span>
                              )}
                            </Badge>
                          </div>

                          {/* Contact Channels */}
                          <div className="text-muted-foreground space-y-0.5 text-xs">
                            {user?.email ? (
                              <div className="flex items-center gap-1.5 truncate">
                                <Mail className="text-muted-foreground/70 size-3.5 shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </div>
                            ) : null}

                            {user?.phone ? (
                              <div className="flex items-center gap-1.5 truncate">
                                <Phone className="text-muted-foreground/70 size-3.5 shrink-0" />
                                <span>{user.phone}</span>
                              </div>
                            ) : null}

                            {/* User ID copy row */}
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-muted-foreground/80 font-mono text-[11px]">
                                ID: {member.userId.slice(0, 8)}...
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground size-5"
                                onClick={() => handleCopy(member.userId)}
                                title="Copy User ID"
                              >
                                {copiedId === member.userId ? (
                                  <Check className="size-3 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <Badge
                        variant={statusVariant(member.status)}
                        className="h-5 shrink-0 text-[10px] uppercase"
                      >
                        {member.status}
                      </Badge>
                    </div>

                    {/* Timeline metadata */}
                    <div className="bg-muted/40 text-muted-foreground grid grid-cols-2 gap-2 rounded-lg p-2.5 text-[11.5px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="text-muted-foreground/70 size-3.5 shrink-0" />
                        <span className="truncate">
                          Invited:{' '}
                          {member.invitedAt ? formatDateTime(member.invitedAt) : 'Onboarding'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarCheck className="text-muted-foreground/70 size-3.5 shrink-0" />
                        <span className="truncate">
                          Accepted:{' '}
                          {member.acceptedAt ? formatDateTime(member.acceptedAt) : 'Pending login'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </QueryState>
        </div>
      </SheetContent>
    </Sheet>
  );
}
