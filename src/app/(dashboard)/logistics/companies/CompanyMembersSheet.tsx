'use client';

import { Users2, Shield, User, Clock, CheckCircle2, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import type { LogisticsCompany, LogisticsMemberRole, LogisticsMemberStatus } from '@/interfaces/logistics';

interface CompanyMembersSheetProps {
  company: LogisticsCompany | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function roleVariant(role: LogisticsMemberRole) {
  return role === 'ADMIN' ? 'default' : 'secondary';
}

function statusVariant(status: LogisticsMemberStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'ACTIVE') return 'default';
  if (status === 'INVITED') return 'secondary';
  return 'destructive';
}

export function CompanyMembersSheet({ company, open, onOpenChange }: CompanyMembersSheetProps) {
  const { data, isLoading, error, refetch } = useLogisticsCompanyMembers(company?.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-2">
            <Users2 className="size-5 text-muted-foreground" />
            <SheetTitle>{company?.name} — POC Roster</SheetTitle>
          </div>
          <SheetDescription>
            Authorized operators and administrators for this logistics partner.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <QueryState
            isLoading={isLoading}
            error={error}
            isEmpty={!data?.members || data.members.length === 0}
            onRetry={refetch}
            emptyTitle="No members found"
            emptyDescription="This company has no active or invited POC members."
          >
            <div className="divide-y divide-border">
              {data?.members.map((member) => (
                <div key={member.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-secondary/80 text-secondary-foreground font-semibold text-xs">
                        {member.role === 'ADMIN' ? (
                          <Shield className="size-4" />
                        ) : (
                          <User className="size-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium flex items-center gap-2">
                          <span className="font-mono text-xs">{member.userId.slice(0, 8)}...</span>
                          <Badge variant={roleVariant(member.role)} className="text-[10px] uppercase h-5">
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Badge variant={statusVariant(member.status)} className="text-[10px] uppercase h-5">
                      {member.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-muted-foreground/70">Invited: </span>
                      {member.invitedAt ? formatDateTime(member.invitedAt) : 'Onboarding'}
                    </div>
                    <div>
                      <span className="text-muted-foreground/70">Accepted: </span>
                      {member.acceptedAt ? formatDateTime(member.acceptedAt) : 'Pending login'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </QueryState>
        </div>
      </SheetContent>
    </Sheet>
  );
}
