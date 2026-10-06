'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Home, Users, Building, CheckCircle2 } from 'lucide-react';
import { api, apiClient } from '@/lib/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/components/ui/formatters';

interface HouseholdRow {
  id: string;
  name?: string;
  unitNumber?: string;
  buildingName?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  memberCount: number;
  status: string;
  startDate?: string;
}

export default function HouseholdsPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('9aa52959-6ab0-4fbf-a8b2-f2284b8dd611');
  const [households, setHouseholds] = useState<HouseholdRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load available communities
  useEffect(() => {
    async function loadCommunities() {
      try {
        const orgsRes = await apiClient.listOrganizations();
        const orgs = orgsRes.data || [];
        const allComms: any[] = [];
        for (const org of orgs) {
          try {
            const commRes = await apiClient.listCommunitiesForOrganization(org.id);
            allComms.push(...(commRes.data || []));
          } catch {
            // ignore
          }
        }
        setCommunities(allComms);
        if (allComms.length > 0 && !allComms.some((c) => c.id === selectedCommunityId)) {
          setSelectedCommunityId(allComms[0].id);
        }
      } catch {
        // ignore
      }
    }
    loadCommunities();
  }, []);

  const loadHouseholds = useCallback(async () => {
    if (!selectedCommunityId) return;
    setIsLoading(true);
    try {
      const res = await api.residents.listHouseholds(selectedCommunityId, { limit: 100 });
      const items = res.items || [];
      const rows: HouseholdRow[] = items.map((h: any) => ({
        id: h.id,
        name: h.name || `Household ${h.unit?.unitNumber || ''}`.trim(),
        unitNumber: h.unit?.unitNumber || 'Common',
        buildingName: h.unit?.building?.name || 'Main Tower',
        primaryContactName: h.primaryContact
          ? `${h.primaryContact.firstName} ${h.primaryContact.lastName}`
          : '—',
        primaryContactPhone: h.primaryContact?.phone || undefined,
        memberCount: Array.isArray(h.members) ? h.members.length : 1,
        status: h.status || 'ACTIVE',
        startDate: h.startDate,
      }));
      setHouseholds(rows);
    } catch {
      setHouseholds([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCommunityId]);

  useEffect(() => {
    loadHouseholds();
  }, [loadHouseholds]);

  const activeCount = households.filter((h) => h.status === 'ACTIVE').length;
  const totalMembers = households.reduce((sum, h) => sum + h.memberCount, 0);

  const columns: ColumnDef<HouseholdRow>[] = [
    {
      key: 'name',
      header: 'Household Name / Family',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            <Home className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-foreground block">{row.name}</span>
            <span className="text-[10px] text-muted">ID: {row.id.substring(0, 8)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'unitNumber',
      header: 'Assigned Unit',
      render: (row) => (
        <div>
          <span className="font-semibold text-xs text-foreground block">{row.unitNumber}</span>
          <span className="text-[11px] text-muted flex items-center gap-1">
            <Building className="h-3 w-3" />
            {row.buildingName}
          </span>
        </div>
      ),
    },
    {
      key: 'primaryContactName',
      header: 'Primary Contact',
      render: (row) => (
        <div>
          <span className="text-xs font-medium text-foreground block">{row.primaryContactName}</span>
          {row.primaryContactPhone && (
            <span className="text-[11px] text-muted">{row.primaryContactPhone}</span>
          )}
        </div>
      ),
    },
    {
      key: 'memberCount',
      header: 'Members',
      align: 'center',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-xs font-medium text-foreground">
          <Users className="h-3 w-3" />
          {row.memberCount}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'startDate',
      header: 'Move-In Date',
      render: (row) => <span className="text-xs text-muted">{formatDate(row.startDate)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Households Directory"
        subtitle="Unit household registries, family units, co-occupants, and residential occupancy tracking."
        breadcrumbs={[{ label: 'Console', href: '/app' }, { label: 'Households Directory' }]}
      >
        {communities.length > 1 && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-muted font-medium">Filter by Society:</span>
            <select
              value={selectedCommunityId}
              onChange={(e) => setSelectedCommunityId(e.target.value)}
              className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Households"
          value={households.length}
          subtitle="Registered residential households"
          icon={Home}
        />
        <MetricCard
          title="Active Occupants"
          value={activeCount}
          subtitle="Occupied living units"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Total Household Members"
          value={totalMembers}
          subtitle="Family members and registered co-residents"
          icon={Users}
        />
      </div>

      <DataTable
        columns={columns}
        data={households}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Search households by name, unit, or resident..."
        searchFilter={(row, q) =>
          (row.name || '').toLowerCase().includes(q) ||
          (row.unitNumber || '').toLowerCase().includes(q) ||
          (row.primaryContactName || '').toLowerCase().includes(q) ||
          (row.buildingName || '').toLowerCase().includes(q)
        }
        isLoading={isLoading}
        emptyTitle="No Households Found"
        emptyDescription="No household records found for the selected community scope."
      />
    </div>
  );
}
