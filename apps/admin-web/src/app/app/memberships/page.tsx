'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
} from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import type { MembershipResponseDto } from '@community-os/contracts';

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<MembershipResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadMemberships = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.iam.listMemberships({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      setMemberships(res.data || []);
      if (res.meta?.pagination) {
        setTotalPages(res.meta.pagination.totalPages || 1);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load memberships.');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  const handleStatusChange = async (
    membershipId: string,
    currentVersion: number,
    newStatus: any,
  ) => {
    try {
      await apiClient.iam.changeMembershipStatus(membershipId, {
        status: newStatus,
        expectedVersion: currentVersion,
      });
      loadMemberships();
    } catch (err) {
      alert((err as ApiClientError).message || 'Failed to update membership status.');
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
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
            <XCircle className="h-3 w-3" />
            Revoked
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tenant Memberships</h1>
        <p className="text-sm text-muted mt-1">
          Authorization memberships connecting users to specific organizations and communities.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-border bg-background py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INVITED">Invited</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REVOKED">Revoked</option>
          </select>

          <button
            onClick={() => loadMemberships()}
            className="rounded-md border border-border p-2 text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
            Loading memberships...
          </div>
        ) : memberships.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted/50 mb-3" />
            <h3 className="text-base font-semibold">No memberships found</h3>
            <p className="text-sm text-muted mt-1">
              No tenant memberships exist in the current scope.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/50 text-xs uppercase text-muted font-semibold">
              <tr>
                <th className="px-6 py-3.5">User Principal</th>
                <th className="px-6 py-3.5">Organization / Community</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Granted Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {memberships.map((m) => (
                <tr key={m.id} className="hover:bg-surface-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground">
                      {m.user?.displayName || 'User: ' + m.userId.slice(0, 8)}
                    </div>
                    <div className="text-xs text-muted font-mono">{m.user?.email || m.userId}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-muted">
                    <div>Org: {m.organizationId}</div>
                    {m.communityId && <div>Community: {m.communityId}</div>}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(m.status)}</td>
                  <td className="px-6 py-4 text-xs text-muted">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={m.status}
                      onChange={(e) => handleStatusChange(m.id, m.version, e.target.value)}
                      className="rounded border border-border bg-background px-2 py-1 text-xs font-semibold focus:border-primary focus:outline-none"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="REVOKED">REVOKED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3 text-xs text-muted">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-border px-2.5 py-1 disabled:opacity-40 hover:bg-surface-muted transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-border px-2.5 py-1 disabled:opacity-40 hover:bg-surface-muted transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
