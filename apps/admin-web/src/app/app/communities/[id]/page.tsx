'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Building,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Archive,
  MapPin,
  Tag,
  Globe,
  Layers,
} from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import type { CommunityResponseDto } from '@community-os/contracts';

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params['id'] as string;

  const [community, setCommunity] = useState<CommunityResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadCommunity = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getCommunity(communityId);
      setCommunity(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load community details.');
    } finally {
      setIsLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  const handleStatusChange = async (newStatus: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED') => {
    if (!community) return;
    if (community.status === newStatus) return;

    const confirmMsg =
      newStatus === 'ARCHIVED'
        ? 'Are you sure you want to ARCHIVE this community? This is a terminal lifecycle state.'
        : `Change status to ${newStatus}?`;

    if (!window.confirm(confirmMsg)) return;

    setIsUpdatingStatus(true);
    setStatusMessage(null);
    setError(null);

    try {
      const updated = await apiClient.changeCommunityStatus(communityId, {
        status: newStatus,
        expectedVersion: community.version,
      });
      setCommunity(updated);
      setStatusMessage(`Community status changed to ${newStatus} successfully.`);
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
        Loading community details...
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || 'Community not found.'}</span>
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
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/app/organizations/${community.organizationId}`}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Parent Organization
        </Link>
        <span className="text-xs text-muted font-mono">
          ID: {community.id} • Version: {community.version}
        </span>
      </div>

      {statusMessage && (
        <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-xs text-success flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Community Main Card */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xl">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{community.name}</h1>
                {getStatusBadge(community.status)}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted font-mono mt-1">
                <span className="inline-flex items-center gap-1 bg-surface-muted px-1.5 py-0.5 rounded text-foreground font-semibold">
                  <Tag className="h-3 w-3" />
                  {community.code}
                </span>
                <span>slug: {community.slug}</span>
              </div>
            </div>
          </div>

          {/* Status Lifecycle Dropdown & Property Hub Button */}
          <div className="flex items-center gap-3">
            <Link
              href={`/app/communities/${community.id}/property`}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Property Master & Units</span>
            </Link>

            <span className="text-xs text-muted font-medium ml-2">Lifecycle:</span>
            <select
              value={community.status}
              disabled={isUpdatingStatus || community.status === 'ARCHIVED'}
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

        {/* Regional & Financial Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border text-xs">
          <div>
            <span className="text-muted block">Operating Currency</span>
            <span className="font-semibold text-foreground text-sm">{community.currency}</span>
          </div>
          <div>
            <span className="text-muted block">Timezone</span>
            <span className="font-semibold text-foreground text-sm">{community.timezone}</span>
          </div>
          <div>
            <span className="text-muted block">Locale</span>
            <span className="font-semibold text-foreground text-sm">{community.locale}</span>
          </div>
        </div>
      </div>

      {/* Address & Physical Location Card */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-border pb-3">
          <MapPin className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold">Physical Property Location</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted block">Street Address</span>
              <span className="font-medium text-foreground">{community.address.addressLine1}</span>
            </div>
            {community.address.addressLine2 && (
              <div>
                <span className="text-xs text-muted block">Line 2 / Landmark</span>
                <span className="font-medium text-foreground">
                  {community.address.addressLine2}
                </span>
              </div>
            )}
            {community.address.locality && (
              <div>
                <span className="text-xs text-muted block">Locality / Sector</span>
                <span className="font-medium text-foreground">{community.address.locality}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted block">City & Postal Code</span>
              <span className="font-medium text-foreground">
                {community.address.city} — {community.address.postalCode}
              </span>
            </div>
            {community.address.region && (
              <div>
                <span className="text-xs text-muted block">State / Region</span>
                <span className="font-medium text-foreground">{community.address.region}</span>
              </div>
            )}
            <div>
              <span className="text-xs text-muted block">Country Code</span>
              <span className="font-medium text-foreground">{community.address.countryCode}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
