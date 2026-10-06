'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  Archive,
} from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import type { OrganizationResponseDto } from '@community-os/contracts';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    legalName: '',
    defaultCurrency: 'INR',
    defaultTimezone: 'Asia/Kolkata',
    defaultLocale: 'en-IN',
  });

  const loadOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.listOrganizations({
        page,
        limit: 10,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setOrganizations(res.data || []);
      if (res.meta?.pagination) {
        setTotalPages(res.meta.pagination.totalPages || 1);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load organizations.');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      await apiClient.createOrganization({
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase(),
        legalName: formData.legalName.trim() || undefined,
        defaultCurrency: formData.defaultCurrency,
        defaultTimezone: formData.defaultTimezone,
        defaultLocale: formData.defaultLocale,
      });

      setIsModalOpen(false);
      setFormData({
        name: '',
        slug: '',
        legalName: '',
        defaultCurrency: 'INR',
        defaultTimezone: 'Asia/Kolkata',
        defaultLocale: 'en-IN',
      });
      loadOrganizations();
    } catch (err) {
      setFormError((err as ApiClientError).message || 'Failed to create organization.');
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations & Enterprise Accounts</h1>
          <p className="text-sm text-muted mt-1">
            Manage property management companies, customer accounts, and society umbrella
            organizations.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Organization
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name, legal name or slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
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
            <option value="SUSPENDED">Suspended</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <button
            onClick={() => loadOrganizations()}
            className="rounded-md border border-border p-2 text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
            Loading enterprise organizations...
          </div>
        ) : organizations.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted/50 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No organizations found</h3>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              {search || statusFilter
                ? 'Try adjusting your search or status filter to find matching records.'
                : 'Get started by provisioning your first enterprise management organization.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/50 text-xs uppercase text-muted font-semibold">
              <tr>
                <th className="px-6 py-3.5">Organization</th>
                <th className="px-6 py-3.5">Slug</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Default Currency / TZ</th>
                <th className="px-6 py-3.5">Created</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-surface-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{org.name}</div>
                    {org.legalName && (
                      <div className="text-xs text-muted truncate max-w-xs">{org.legalName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted">{org.slug}</td>
                  <td className="px-6 py-4">{getStatusBadge(org.status)}</td>
                  <td className="px-6 py-4 text-xs text-muted">
                    <span className="font-semibold text-foreground">{org.defaultCurrency}</span> •{' '}
                    {org.defaultTimezone}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/app/organizations/${org.id}`}
                      className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-medium hover:border-primary hover:text-primary transition-colors"
                    >
                      Manage
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Footer */}
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

      {/* Create Organization Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">Create Enterprise Organization</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prestige Management Corp"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug:
                        prev.slug === '' || prev.slug.startsWith(autoSlug.slice(0, 3))
                          ? autoSlug
                          : prev.slug,
                    }));
                  }}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Unique Slug Identifier *
                </label>
                <input
                  type="text"
                  required
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  placeholder="e.g. prestige-management-corp"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-[10px] text-muted">
                  Used in subdomain routing and multi-tenant scoping.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Legal Entity Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prestige Estates Projects Limited"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Default Currency *
                  </label>
                  <select
                    value={formData.defaultCurrency}
                    onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                    className="w-full rounded-md border border-border bg-background py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="SGD">SGD (S$)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Default Timezone *
                  </label>
                  <select
                    value={formData.defaultTimezone}
                    onChange={(e) => setFormData({ ...formData, defaultTimezone: e.target.value })}
                    className="w-full rounded-md border border-border bg-background py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Provisioning...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
