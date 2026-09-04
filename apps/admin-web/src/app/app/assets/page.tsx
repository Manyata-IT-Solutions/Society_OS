'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  QrCode,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Building2,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';

export default function AssetRegistryPage() {
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';
  const [assets, setAssets] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLifecycle, setSelectedLifecycle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCriticality, setSelectedCriticality] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, metricsRes, catRes] = await Promise.all([
        api.assets.list({
          organizationId: orgId,
          communityId: commId,
          categoryId: selectedCategory || undefined,
          lifecycleState: selectedLifecycle || undefined,
          operationalStatus: selectedStatus || undefined,
          criticality: selectedCriticality || undefined,
          search: search || undefined,
          limit: 50,
        }),
        api.assets.getMetrics(orgId, commId),
        api.assetCategories.list({ organizationId: orgId, communityId: commId }),
      ]);

      setAssets(listRes?.items || []);
      setMetrics(metricsRes || null);
      setCategories(catRes || []);
    } catch (err) {
      console.error('Failed to load assets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedLifecycle, selectedStatus, selectedCriticality]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Operational
          </span>
        );
      case 'UNDER_MAINTENANCE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <Wrench className="w-3 h-3 mr-1" />
            Maintenance
          </span>
        );
      case 'OUT_OF_SERVICE':
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Out of Service
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getLifecycleBadge = (state: string) => {
    switch (state) {
      case 'ACTIVE':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            ACTIVE
          </span>
        );
      case 'COMMISSIONED':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
            COMMISSIONED
          </span>
        );
      case 'DECOMMISSIONED':
      case 'DISPOSED':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            {state}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {state}
          </span>
        );
    }
  };

  const getCriticalityBadge = (crit: string) => {
    switch (crit) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Boxes className="h-7 w-7 text-primary" />
            Physical Asset Registry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise physical asset lifecycle, QR/barcode identification, warranties, AMC
            contracts, and service history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/assets/scan"
            className="inline-flex items-center px-3 py-2 border border-border shadow-sm text-sm font-medium rounded-lg text-foreground bg-card hover:bg-surface-muted transition-colors"
          >
            <QrCode className="h-4 w-4 mr-2 text-primary" />
            Scan QR / Barcode
          </Link>

          <Link
            href="/app/assets/import"
            className="inline-flex items-center px-3 py-2 border border-border shadow-sm text-sm font-medium rounded-lg text-foreground bg-card hover:bg-surface-muted transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Link>

          <Link
            href="/app/assets/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Register Asset
          </Link>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Assets</span>
            <Boxes className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{metrics?.totalAssets ?? '—'}</p>
          <span className="text-xs text-muted-foreground">Active in catalog</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Operational
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {metrics?.operationalCount ?? '—'}
          </p>
          <span className="text-xs text-muted-foreground">Health rating 100%</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              In Maintenance
            </span>
            <Wrench className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {metrics?.underMaintenanceCount ?? '—'}
          </p>
          <span className="text-xs text-muted-foreground">Active work orders</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
              Critical Breakdown
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {metrics?.criticalOutageCount ?? '—'}
          </p>
          <span className="text-xs text-muted-foreground">Immediate priority</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Active AMCs / Warranties
            </span>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {metrics?.activeContractsCount ?? '—'}
          </p>
          <span className="text-xs text-muted-foreground">Under service coverage</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by asset code, name, serial number, or manufacturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 border border-input rounded-lg bg-background text-foreground text-xs"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedLifecycle}
            onChange={(e) => setSelectedLifecycle(e.target.value)}
            className="px-3 py-1.5 border border-input rounded-lg bg-background text-foreground text-xs"
          >
            <option value="">All Lifecycles</option>
            <option value="REGISTERED">REGISTERED</option>
            <option value="INSTALLED">INSTALLED</option>
            <option value="COMMISSIONED">COMMISSIONED</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="DECOMMISSIONED">DECOMMISSIONED</option>
            <option value="DISPOSED">DISPOSED</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 border border-input rounded-lg bg-background text-foreground text-xs"
          >
            <option value="">All Operational Statuses</option>
            <option value="OPERATIONAL">OPERATIONAL</option>
            <option value="DEGRADED">DEGRADED</option>
            <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
            <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
          </select>

          <select
            value={selectedCriticality}
            onChange={(e) => setSelectedCriticality(e.target.value)}
            className="px-3 py-1.5 border border-input rounded-lg bg-background text-foreground text-xs"
          >
            <option value="">All Criticalities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <button
            onClick={() => {
              setSelectedCategory('');
              setSelectedLifecycle('');
              setSelectedStatus('');
              setSelectedCriticality('');
              setSearch('');
            }}
            className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground underline ml-auto"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <p>Loading asset catalog...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Boxes className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium text-foreground">No assets found matching current criteria</p>
            <p className="text-sm mt-1">
              Try resetting filters or registering a new physical asset.
            </p>
            <Link
              href="/app/assets/new"
              className="inline-flex items-center px-4 py-2 mt-4 text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Register New Asset
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3.5 px-4">Asset Code & Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Criticality</th>
                  <th className="py-3.5 px-4">Lifecycle</th>
                  <th className="py-3.5 px-4">Operational Status</th>
                  <th className="py-3.5 px-4">Serial / QR</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/app/assets/${asset.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors flex flex-col"
                      >
                        <span>{asset.name}</span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {asset.assetCode}
                        </span>
                      </Link>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-xs text-foreground font-medium">
                        {asset.categoryName || '—'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-xs text-foreground flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span>
                          {asset.buildingName || asset.locationDescription || asset.locationType}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">{getCriticalityBadge(asset.criticality)}</td>

                    <td className="py-3 px-4">{getLifecycleBadge(asset.lifecycleState)}</td>

                    <td className="py-3 px-4">{getStatusBadge(asset.operationalStatus)}</td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-muted-foreground flex flex-col">
                        <span>{asset.serialNumber || '—'}</span>
                        <span className="text-[10px] text-primary truncate max-w-[120px]">
                          {asset.qrIdentifier}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/app/assets/${asset.id}`}
                        className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        View
                        <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
