'use client';

import { useState } from 'react';
import { Truck, Users, Power, Search, Building2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { QueryState, errorMessageOf } from '@/components/general/query-state';
import { formatDateTime } from '@/helpers/format';
import { useCustomToast } from '@/hooks/useCustomToast';
import { useLogisticsCompanies, useUpdateLogisticsCompany } from '@/services/logistics.services';
import type { LogisticsCompany, LogisticsCompanyStatus } from '@/interfaces/logistics';
import { OnboardCompanyDialog } from './OnboardCompanyDialog';
import { CompanyMembersSheet } from './CompanyMembersSheet';

const ALL_STATUS = '__all__';
const PAGE_SIZE = 20;

export function CompaniesView() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>(ALL_STATUS);
  const [page, setPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<LogisticsCompany | null>(null);
  const [rosterOpen, setRosterOpen] = useState(false);

  const { showToast } = useCustomToast();
  const updateCompany = useUpdateLogisticsCompany();

  const { data, isLoading, error, refetch } = useLogisticsCompanies({
    status: status === ALL_STATUS ? undefined : (status as LogisticsCompanyStatus),
    page,
    limit: PAGE_SIZE,
  });

  const filteredCompanies = (data?.companies ?? []).filter((company) =>
    company.name.toLowerCase().includes(q.trim().toLowerCase()),
  );


  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const handleToggleStatus = (company: LogisticsCompany) => {
    const nextStatus: LogisticsCompanyStatus =
      company.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    updateCompany.mutate(
      {
        id: company.id,
        payload: { status: nextStatus },
      },
      {
        onSuccess: (updated) => {
          showToast({
            title: 'Status updated',
            description: `${updated.name} is now ${updated.status}.`,
            type: 'success',
          });
        },
        onError: (err) => {
          showToast({
            title: 'Failed to update company',
            description: errorMessageOf(err),
            type: 'error',
          });
        },
      },
    );
  };

  const handleOpenRoster = (company: LogisticsCompany) => {
    setSelectedCompany(company);
    setRosterOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Truck className="text-muted-foreground size-[20px]" aria-hidden />
            Logistics Companies
          </h1>
          <p className="text-muted-foreground max-w-2xl text-[12.5px] leading-relaxed">
            Manage partner courier companies, configure activation statuses, and inspect authorized
            POC rosters.
          </p>
        </div>
        <OnboardCompanyDialog />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
          <Input
            placeholder="Search by company name..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
        <Select
          value={status}
          onValueChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS}>All Statuses</SelectItem>
            <SelectItem value="ENABLED">Enabled</SelectItem>
            <SelectItem value="DISABLED">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={filteredCompanies.length === 0}
        onRetry={refetch}
        emptyTitle="No logistics companies"
        emptyDescription={
          q ? 'No companies match your search.' : 'Get started by onboarding a new courier company.'
        }
      >
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-secondary text-secondary-foreground flex size-7 items-center justify-center rounded-md text-xs font-semibold">
                        <Building2 className="size-3.5" />
                      </div>
                      <span>{company.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Badge
                        variant={company.status === 'ENABLED' ? 'default' : 'secondary'}
                        className="text-[11px]"
                      >
                        {company.status}
                      </Badge>
                      <Switch
                        checked={company.status === 'ENABLED'}
                        onCheckedChange={() => handleToggleStatus(company)}
                        disabled={updateCompany.isPending}
                        aria-label="Toggle company status"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDateTime(company.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => handleOpenRoster(company)}
                    >
                      <Users className="size-3.5" />
                      POC Roster
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="text-muted-foreground flex items-center justify-between pt-2 text-xs">
            <span>
              Showing {filteredCompanies.length} of {data?.total ?? 0} companies
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </QueryState>

      {/* Roster Slide-Over */}
      <CompanyMembersSheet
        company={selectedCompany}
        open={rosterOpen}
        onOpenChange={setRosterOpen}
      />
    </div>
  );
}
