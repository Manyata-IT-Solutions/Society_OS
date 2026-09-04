'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import {
  Layers,
  Plus,
  Search,
  Building,
  Calendar,
  CheckCircle,
  Archive,
  RefreshCw,
} from 'lucide-react';

export default function PortfoliosPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Create Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const loadOrganizations = useCallback(async () => {
    try {
      const res = await api.listOrganizations({ limit: 50 });
      const orgs = res.data || [];
      setOrganizations(orgs);
      if (orgs.length > 0 && !selectedOrgId && orgs[0]) {
        setSelectedOrgId(orgs[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load organizations.');
    }
  }, [selectedOrgId]);

  const loadPortfolios = useCallback(async () => {
    if (!selectedOrgId) return;
    try {
      setIsLoading(true);
      const res = await api.property.listPortfolios(selectedOrgId, {
        search: search.trim() || undefined,
      });
      // Normalize: API envelope returns { data: { items: [], total } } or { items: [] } or []
      const raw = (res as any)?.data !== undefined ? (res as any).data : res;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray((res as any)?.items)
            ? (res as any).items
            : [];
      console.log('DEBUG loadPortfolios list count:', list.length, 'raw items count:', raw?.items?.length);
      setPortfolios(list);
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load portfolios.');
      setPortfolios([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrgId, search]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    if (selectedOrgId) {
      loadPortfolios();
    }
  }, [selectedOrgId, loadPortfolios]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const createdRes = await api.property.createPortfolio(selectedOrgId, {
        name: formData.name,
        code: formData.code,
        description: formData.description || undefined,
      });

      const newPortfolio = (createdRes as any)?.data || createdRes || {
        id: `port-${Date.now()}`,
        name: formData.name,
        code: formData.code,
        description: formData.description,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        communities: [],
      };

      // Optimistically display the newly created portfolio card immediately
      setPortfolios((prev) => [newPortfolio, ...prev.filter((p) => p.id !== newPortfolio.id)]);

      setShowCreateModal(false);
      setFormData({ name: '', code: '', description: '' });
      await loadPortfolios();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create portfolio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enterprise Portfolios</h1>
          <p className="text-sm text-muted">
            Group multiple residential communities and property divisions under regional portfolios.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPortfolios}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-muted"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Portfolio</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Filters & Org Selector */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted whitespace-nowrap">Organization:</label>
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Portfolio Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center p-12 text-muted">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      ) : portfolios.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <Layers className="h-10 w-10 text-muted mb-3" />
          <h3 className="font-semibold text-lg">No portfolios created</h3>
          <p className="text-sm text-muted max-w-sm mt-1 mb-4">
            Portfolios let you group communities by city, region, or management division.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Portfolio</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-sm hover:border-primary/50 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-base">{portfolio.name}</h3>
                    <span className="inline-block mt-1 font-mono text-xs text-muted bg-surface-muted px-2 py-0.5 rounded">
                      {portfolio.code}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      portfolio.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {portfolio.status === 'ACTIVE' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Archive className="h-3 w-3" />
                    )}
                    {portfolio.status}
                  </span>
                </div>

                <p className="text-sm text-muted mt-3 line-clamp-2">
                  {portfolio.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted">
                <div className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5" />
                  <span>
                    {portfolio.communities
                      ? `${portfolio.communities.length} Communities`
                      : 'Enterprise'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(portfolio.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Portfolio Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-1">Create Enterprise Portfolio</h2>
            <p className="text-xs text-muted mb-4">
              Create a regional or divisional portfolio under the selected organization.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Portfolio Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North India Residential Portfolio"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Portfolio Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NIRP-01"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief notes about properties included in this portfolio..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Portfolio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
