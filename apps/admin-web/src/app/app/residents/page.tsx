'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users, UserPlus, ShieldCheck, Mail, Phone, CheckCircle2, X } from 'lucide-react';
import { api, apiClient } from '@/lib/api-client';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { FormField } from '@/components/ui/form-field';

interface ResidentItem {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  status: string;
  idProofVerified?: boolean;
  createdAt?: string;
}

export default function ResidentsRosterPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('9aa52959-6ab0-4fbf-a8b2-f2284b8dd611');
  const [residents, setResidents] = useState<ResidentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const loadResidents = useCallback(async () => {
    if (!selectedCommunityId) return;
    setIsLoading(true);
    try {
      const res = await api.residents.listResidents(selectedCommunityId, { limit: 100 });
      setResidents(res.items || []);
    } catch {
      setResidents([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCommunityId]);

  useEffect(() => {
    loadResidents();
  }, [loadResidents]);

  const handleCreateResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setIsSubmitting(true);
    try {
      await api.residents.createResident(selectedCommunityId, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phoneNumber: form.phoneNumber.trim() || undefined,
      });
      setIsAddModalOpen(false);
      setForm({ firstName: '', lastName: '', email: '', phoneNumber: '' });
      loadResidents();
    } catch (err) {
      alert((err as Error).message || 'Failed to register resident.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = residents.filter((r) => r.status === 'ACTIVE').length;
  const verifiedCount = residents.filter((r) => r.idProofVerified).length;

  const columns: ColumnDef<ResidentItem>[] = [
    {
      key: 'name',
      header: 'Resident Name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            {row.firstName ? row.firstName.charAt(0).toUpperCase() : 'R'}
          </div>
          <div>
            <span className="font-semibold text-foreground block">
              {row.firstName} {row.lastName}
            </span>
            <span className="text-[10px] text-muted">Resident ID: {row.id.substring(0, 8)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact Information',
      render: (row) => (
        <div className="space-y-0.5 text-xs text-muted">
          {row.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{row.email}</span>
            </div>
          )}
          {row.phoneNumber && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{row.phoneNumber}</span>
            </div>
          )}
          {!row.email && !row.phoneNumber && <span>—</span>}
        </div>
      ),
    },
    {
      key: 'idProofVerified',
      header: 'KYC Verification',
      render: (row) =>
        row.idProofVerified ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> Verified
          </span>
        ) : (
          <span className="text-xs text-muted">Pending</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status || 'ACTIVE'} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Link
          href={`/app/residents/${row.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          View Profile
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Residents Roster"
        subtitle="Manage resident profiles, KYC verification records, and household member assignments."
        breadcrumbs={[{ label: 'Console', href: '/app' }, { label: 'Residents Roster' }]}
        primaryAction={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Register Resident</span>
          </button>
        }
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
          title="Total Residents"
          value={residents.length}
          subtitle="Registered community members"
          icon={Users}
        />
        <MetricCard
          title="Active Occupants"
          value={activeCount}
          subtitle="Currently active residents"
          icon={CheckCircle2}
        />
        <MetricCard
          title="KYC Verified"
          value={verifiedCount}
          subtitle="Verified identity documents"
          icon={ShieldCheck}
        />
      </div>

      <DataTable
        columns={columns}
        data={residents}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Search residents by name, email, or phone..."
        searchFilter={(row, q) =>
          `${row.firstName} ${row.lastName}`.toLowerCase().includes(q) ||
          (row.email || '').toLowerCase().includes(q) ||
          (row.phoneNumber || '').includes(q)
        }
        isLoading={isLoading}
        emptyTitle="No Residents Found"
        emptyDescription="No resident records found for the selected community scope."
      />

      {/* Add Resident Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground">Register New Resident</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateResident} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="First Name" required>
                  <input
                    required
                    placeholder="e.g. Ramesh"
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                  />
                </FormField>
                <FormField label="Last Name" required>
                  <input
                    required
                    placeholder="e.g. Sharma"
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                  />
                </FormField>
              </div>
              <FormField label="Email Address">
                <input
                  placeholder="ramesh.sharma@example.com"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                />
              </FormField>
              <FormField label="Mobile Phone">
                <input
                  placeholder="+91 98765 43210"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                />
              </FormField>
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary text-primary-foreground px-4 py-2 hover:bg-primary-hover disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Resident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
