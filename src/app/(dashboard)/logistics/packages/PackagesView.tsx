'use client';

import { useState } from 'react';
import { Package, Search, Filter, Eye } from 'lucide-react';

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
import { QueryState } from '@/components/general/query-state';
import { formatDateTime } from '@/helpers/format';
import { useLogisticsCompanies, useLogisticsPackages } from '@/services/logistics.services';
import type { LogisticsPackageStatus } from '@/interfaces/logistics';
import { PackageDetailSheet, statusBadgeVariant } from './PackageDetailSheet';

const ALL_FILTER = '__all__';
const PAGE_SIZE = 20;

const STATUSES: { value: LogisticsPackageStatus; label: string }[] = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'PACKAGED', label: 'Packaged' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function PackagesView() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>(ALL_FILTER);
  const [companyId, setCompanyId] = useState<string>(ALL_FILTER);
  const [page, setPage] = useState(1);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Fetch available companies for the filter dropdown
  const { data: companiesData } = useLogisticsCompanies({ limit: 100 });

  const { data, isLoading, error, refetch } = useLogisticsPackages({
    status: status === ALL_FILTER ? undefined : (status as LogisticsPackageStatus),
    companyId: companyId === ALL_FILTER ? undefined : companyId,
    page,
    limit: PAGE_SIZE,
  });

  const companiesList = companiesData?.companies ?? [];
  const companyMap = new Map(companiesList.map((c) => [c.id, c.name]));



  const filteredPackages = (data?.packages ?? []).filter((pkg) => {
    if (!q.trim()) return true;
    const term = q.trim().toLowerCase();
    const matchesTracking = pkg.trackingNumber?.toLowerCase().includes(term);
    const matchesTrade = pkg.tradeId.toLowerCase().includes(term);
    const matchesCompany = companyMap.get(pkg.companyId)?.toLowerCase().includes(term);
    return matchesTracking || matchesTrade || matchesCompany;
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const handleOpenDetail = (id: string) => {
    setSelectedPackageId(id);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Package className="text-muted-foreground size-[20px]" aria-hidden />
          Shipments & Packages
        </h1>
        <p className="text-muted-foreground max-w-2xl text-[12.5px] leading-relaxed">
          Real-time oversight of all trade shipments across courier partners, status progression, and tracking codes.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search tracking, trade ID..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>

        {/* Status filter */}
        <Select
          value={status}
          onValueChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER}>All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Company filter */}
        <Select
          value={companyId}
          onValueChange={(val) => {
            setCompanyId(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="All Couriers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER}>All Couriers</SelectItem>
            {companiesList.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>

        </Select>
      </div>

      {/* Table */}
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={filteredPackages.length === 0}
        onRetry={refetch}
        emptyTitle="No shipments found"
        emptyDescription={
          q || status !== ALL_FILTER || companyId !== ALL_FILTER
            ? 'No packages match the selected criteria.'
            : 'No package shipments have been requested yet.'
        }
      >
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package ID / Trade</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tracking Code</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-mono text-xs font-medium">{pkg.id.slice(0, 8)}...</div>
                      <div className="text-[11px] text-muted-foreground font-mono">Trade: {pkg.tradeId.slice(0, 8)}...</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    {companyMap.get(pkg.companyId) ?? `${pkg.companyId.slice(0, 8)}...`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(pkg.status)} className="text-[10px] uppercase">
                      {pkg.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {pkg.trackingNumber ? (
                      <span className="font-semibold text-foreground">{pkg.trackingNumber}</span>
                    ) : (
                      <span className="text-muted-foreground italic">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(pkg.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 h-8 text-xs"
                      onClick={() => handleOpenDetail(pkg.id)}
                    >
                      <Eye className="size-3.5" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <span>
              Showing {filteredPackages.length} of {data?.total ?? 0} packages
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

      {/* Detail Slide-Over */}
      <PackageDetailSheet
        packageId={selectedPackageId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
