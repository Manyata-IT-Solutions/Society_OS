'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Shield, Plus, Search, RefreshCw, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { RoleResponseDto } from '@community-os/contracts';

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleResponseDto | null>(null);

  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.iam.listRoles({
        scopeType: scopeFilter || undefined,
        search: search || undefined,
      });
      setRoles(res.data || []);
      if (res.data && res.data.length > 0 && !selectedRole) {
        setSelectedRole(res.data[0] || null);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load roles.');
    } finally {
      setIsLoading(false);
    }
  }, [scopeFilter, search, selectedRole]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-sm text-muted mt-1">
            System predefined roles and custom tenant-defined permission bundles.
          </p>
        </div>
        <Link
          href="/app/roles/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Custom Role
        </Link>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search roles by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-sm placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          className="rounded-md border border-border bg-background py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Scopes</option>
          <option value="PLATFORM">Platform Scope</option>
          <option value="ORGANIZATION">Organization Scope</option>
          <option value="COMMUNITY">Community Scope</option>
        </select>

        <button
          onClick={() => loadRoles()}
          className="rounded-md border border-border p-2 text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
          title="Refresh roles"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Two Column Layout: Role List on left, Selected Role Permissions on right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden md:col-span-1">
          <div className="border-b border-border bg-surface-muted/50 px-4 py-3 text-xs font-semibold uppercase text-muted">
            Available Roles ({roles.length})
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`w-full p-4 text-left transition-colors flex flex-col gap-1 ${
                  selectedRole?.id === role.id
                    ? 'bg-primary/10 border-l-4 border-l-primary'
                    : 'hover:bg-surface-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{role.name}</span>
                  {role.isSystem && (
                    <span className="inline-flex items-center gap-1 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                      <Lock className="h-3 w-3" /> System
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted font-mono">{role.code}</div>
                <div className="text-[11px] text-muted mt-1">
                  Scope: <span className="font-semibold text-foreground">{role.scopeType}</span> •{' '}
                  {role.permissions.length} permissions
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Role Permissions Details */}
        <div className="rounded-xl border border-border bg-surface shadow-sm p-6 md:col-span-2 space-y-6">
          {selectedRole ? (
            <>
              <div className="border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{selectedRole.name}</h2>
                      <p className="text-xs text-muted font-mono">{selectedRole.code}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {selectedRole.scopeType} SCOPE
                  </span>
                </div>
                {selectedRole.description && (
                  <p className="text-xs text-muted mt-3">{selectedRole.description}</p>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                  Granted Permissions ({selectedRole.permissions.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                  {selectedRole.permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="rounded-lg border border-border bg-background p-2.5 text-xs flex items-start gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <div>
                        <div className="font-mono font-semibold text-foreground">{perm.code}</div>
                        {perm.description && (
                          <div className="text-[11px] text-muted mt-0.5">{perm.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-sm text-muted">
              Select a role to view its permissions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
