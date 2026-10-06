'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  Archive,
  MapPin,
  Globe,
  Tag,
} from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import type { OrganizationResponseDto, CommunityResponseDto } from '@community-os/contracts';

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params['id'] as string;

  const [organization, setOrganization] = useState<OrganizationResponseDto | null>(null);
  const [communities, setCommunities] = useState<CommunityResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [org, comms] = await Promise.all([
        apiClient.getOrganization(orgId),
        apiClient.listCommunitiesForOrganization(orgId),
      ]);
      setOrganization(org);
      setCommunities(comms.data || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load organization details.');
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (newStatus: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED') => {
    if (!organization) return;
    if (organization.status === newStatus) return;

    const confirmMsg =
      newStatus === 'ARCHIVED'
        ? 'Are you sure you want to ARCHIVE this organization? This is a terminal lifecycle state.'
        : `Change status to ${newStatus}?`;

    if (!window.confirm(confirmMsg)) return;

    setIsUpdatingStatus(true);
    setStatusMessage(null);
    setError(null);

    try {
      const updated = await apiClient.changeOrganizationStatus(orgId, {
        status: newStatus,
        expectedVersion: organization.version,
      });
      setOrganization(updated);
      setStatusMessage(`Organization status changed to ${newStatus} successfully.`);
    } catch (err) {
      setError((err as ApiClientError).message || 'Status transition failed.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
            <Clock className="h-3 w-3" />
            Suspended
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/20 px-2.5 py-0.5 text-xs font-medium text-muted">
            <Archive className="h-3 w-3" />
            Archived
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-sm text-muted">
        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
        Loading organization details...
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || 'Organization not found.'}</span>
        </div>
        <button
          onClick={() => router.push('/app/organizations')}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Top Breadcrumb / Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/app/organizations"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Organizations List
        </Link>
        <span className="text-xs text-muted font-mono">
          ID: {organization.id} • Version: {organization.version}
        </span>
      </div>

      {statusMessage && (
        <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-xs text-success flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Organization Card Header */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xl">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{organization.name}</h1>
                {getStatusBadge(organization.status)}
              </div>
              <p className="text-xs text-muted font-mono mt-0.5">slug: {organization.slug}</p>
            </div>
          </div>

          {/* Status Switcher Control */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted font-medium">Lifecycle:</span>
            <select
              value={organization.status}
              disabled={isUpdatingStatus || organization.status === 'ARCHIVED'}
              onChange={(e) =>
                handleStatusChange(e.target.value as 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED')
              }
              className="rounded-md border border-border bg-background py-1.5 px-3 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="ARCHIVED">ARCHIVED (Terminal)</option>
            </select>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border text-xs">
          <div>
            <span className="text-muted block">Legal Entity Name</span>
            <span className="font-semibold text-foreground text-sm">
              {organization.legalName || '—'}
            </span>
          </div>
          <div>
            <span className="text-muted block">Default Currency</span>
            <span className="font-semibold text-foreground text-sm">
              {organization.defaultCurrency}
            </span>
          </div>
          <div>
            <span className="text-muted block">Timezone</span>
            <span className="font-semibold text-foreground text-sm">
              {organization.defaultTimezone}
            </span>
          </div>
          <div>
            <span className="text-muted block">Locale</span>
            <span className="font-semibold text-foreground text-sm">
              {organization.defaultLocale}
            </span>
          </div>
        </div>
      </div>

      {/* Communities Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Communities & Properties</h2>
            <p className="text-xs text-muted">
              Individual residential societies and complexes managed under {organization.name}.
            </p>
          </div>
          <Link
            href={`/app/organizations/${orgId}/communities/new`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Community
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          {communities.length === 0 ? (
            <div className="p-8 text-center">
              <Globe className="mx-auto h-10 w-10 text-muted/50 mb-2" />
              <h3 className="text-sm font-semibold">No communities provisioned yet</h3>
              <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
                Add a residential society or commercial complex under this enterprise organization.
              </p>
              <div className="mt-4">
                <Link
                  href={`/app/organizations/${orgId}/communities/new`}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-surface-muted transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Provision First Community
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted/50 text-xs uppercase text-muted font-semibold">
                <tr>
                  <th className="px-6 py-3">Community Name</th>
                  <th className="px-6 py-3">Code / Slug</th>
                  <th className="px-6 py-3">City & Country</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Currency</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {communities.map((comm) => (
                  <tr key={comm.id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-foreground">{comm.name}</div>
                      <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {comm.address.addressLine1}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="inline-flex items-center gap-1 rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                        <Tag className="h-3 w-3" />
                        {comm.code}
                      </div>
                      <div className="text-[11px] text-muted font-mono mt-0.5">{comm.slug}</div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-muted">
                      {comm.address.city}, {comm.address.countryCode}
                    </td>
                    <td className="px-6 py-3.5">{getStatusBadge(comm.status)}</td>
                    <td className="px-6 py-3.5 text-xs font-semibold">{comm.currency}</td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/app/communities/${comm.id}`}
                        className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-medium hover:border-primary hover:text-primary transition-colors"
                      >
                        Details
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
