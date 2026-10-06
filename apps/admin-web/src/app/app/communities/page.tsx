'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Building2, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/components/ui/formatters';

interface CommunityRow {
  id: string;
  name: string;
  code: string;
  status: string;
  organizationId: string;
  organizationName: string;
  createdAt: string;
}

export default function CommunitiesMasterPage() {
  const [communities, setCommunities] = useState<CommunityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [organizationsCount, setOrganizationsCount] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const orgsRes = await apiClient.listOrganizations();
      const orgs = orgsRes.data || [];
      setOrganizationsCount(orgs.length);

      const allRows: CommunityRow[] = [];
      for (const org of orgs) {
        try {
          const commRes = await apiClient.listCommunitiesForOrganization(org.id);
          const commItems = commRes.data || [];
          for (const c of commItems) {
            allRows.push({
              id: c.id,
              name: c.name,
              code: c.code,
              status: c.status || 'ACTIVE',
              organizationId: org.id,
              organizationName: org.name,
              createdAt: c.createdAt,
            });
          }
        } catch {
          // continue with next org
        }
      }
      setCommunities(allRows);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeCount = communities.filter((c) => c.status === 'ACTIVE').length;

  const columns: ColumnDef<CommunityRow>[] = [
    {
      key: 'name',
      header: 'Community / Township',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <Link
              href={`/app/communities/${row.id}`}
              className="font-semibold text-foreground hover:text-primary hover:underline block"
            >
              {row.name}
            </Link>
            <span className="text-[11px] text-muted font-mono">{row.code}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'organizationName',
      header: 'Parent Organization',
      render: (row) => (
        <Link
          href={`/app/organizations/${row.organizationId}`}
          className="text-xs text-foreground hover:text-primary hover:underline"
        >
          {row.organizationName}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'createdAt',
      header: 'Established Date',
      render: (row) => <span className="text-xs text-muted">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Link
          href={`/app/communities/${row.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <span>View 360</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communities Master"
        subtitle="Manage master residential societies, gated townships, and commercial portfolios across enterprise accounts."
        breadcrumbs={[{ label: 'Console', href: '/app' }, { label: 'Communities Master' }]}
        primaryAction={
          <Link
            href="/app/organizations"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Community</span>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Communities"
          value={communities.length}
          subtitle="Configured residential societies"
          icon={Building2}
        />
        <MetricCard
          title="Active Societies"
          value={activeCount}
          subtitle="Operational township instances"
          icon={ShieldCheck}
        />
        <MetricCard
          title="Parent Organizations"
          value={organizationsCount}
          subtitle="Property management companies"
          icon={Building2}
        />
      </div>

      <DataTable
        columns={columns}
        data={communities}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Search communities by name, code, or organization..."
        searchFilter={(row, q) =>
          row.name.toLowerCase().includes(q) ||
          row.code.toLowerCase().includes(q) ||
          row.organizationName.toLowerCase().includes(q)
        }
        isLoading={isLoading}
        emptyTitle="No Communities Found"
        emptyDescription="There are no communities configured under your authorized organizations."
      />
    </div>
  );
}
