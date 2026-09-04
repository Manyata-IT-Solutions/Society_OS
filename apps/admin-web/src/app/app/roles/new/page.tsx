'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import type { PermissionResponseDto } from '@community-os/contracts';

export default function NewRolePage() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<PermissionResponseDto[]>([]);
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    scopeType: 'ORGANIZATION' as 'PLATFORM' | 'ORGANIZATION' | 'COMMUNITY' | 'OWN',
  });

  const loadPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const perms = await apiClient.iam.listPermissions();
      setPermissions(perms);
    } catch (err) {
      setError((err as Error).message || 'Failed to load permissions registry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const togglePermission = (code: string) => {
    setSelectedPermissionCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const toggleGroup = (resource: string) => {
    const groupCodes = permissions.filter((p) => p.resource === resource).map((p) => p.code);
    const allSelected = groupCodes.every((c) => selectedPermissionCodes.includes(c));

    if (allSelected) {
      setSelectedPermissionCodes((prev) => prev.filter((c) => !groupCodes.includes(c)));
    } else {
      setSelectedPermissionCodes((prev) => Array.from(new Set([...prev, ...groupCodes])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPermissionCodes.length === 0) {
      setError('Please select at least one permission for this role.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.iam.createRole({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        scopeType: formData.scopeType,
        permissionCodes: selectedPermissionCodes,
      });

      router.push('/app/roles');
    } catch (err) {
      setError((err as ApiClientError).message || 'Failed to create role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group permissions by resource
  const grouped = permissions.reduce(
    (acc, p) => {
      if (!acc[p.resource]) acc[p.resource] = [];
      acc[p.resource]?.push(p);
      return acc;
    },
    {} as Record<string, PermissionResponseDto[]>,
  );

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted">Loading permissions...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          href="/app/roles"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Roles
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Create Custom Role</h1>
            <p className="text-xs text-muted">
              Define a tenant-scoped role with granular permission entitlements.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Role Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Facility Operations Manager"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const autoCode = name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
                  setFormData((prev) => ({
                    ...prev,
                    name,
                    code: prev.code === '' ? autoCode : prev.code,
                  }));
                }}
                className="w-full rounded-md border border-border bg-background py-2 px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Role Code *</label>
              <input
                type="text"
                required
                pattern="^[A-Z0-9_]+$"
                placeholder="e.g. FACILITY_MANAGER"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full rounded-md border border-border bg-background py-2 px-3 font-mono text-sm uppercase focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Scope Level *</label>
              <select
                value={formData.scopeType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scopeType: e.target.value as 'ORGANIZATION' | 'COMMUNITY',
                  })
                }
                className="w-full rounded-md border border-border bg-background py-2 px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ORGANIZATION">Organization Scope (All Properties in Org)</option>
                <option value="COMMUNITY">Community Scope (Specific Property)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Description</label>
              <input
                type="text"
                placeholder="Role responsibilities and purpose"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-border bg-background py-2 px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Granular Permissions Selection */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Permission Entitlements ({selectedPermissionCodes.length} selected)
                </h3>
                <p className="text-[11px] text-muted">
                  Select the resource permissions granted to this role.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(grouped).map(([resource, perms]) => {
                const groupCodes = perms.map((p) => p.code);
                const allSelected = groupCodes.every((c) => selectedPermissionCodes.includes(c));

                return (
                  <div
                    key={resource}
                    className="rounded-xl border border-border bg-background p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-xs font-bold uppercase text-foreground">
                        {resource} Domain
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleGroup(resource)}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map((p) => {
                        const checked = selectedPermissionCodes.includes(p.code);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer text-xs transition-colors ${
                              checked
                                ? 'border-primary/50 bg-primary/5 text-foreground'
                                : 'border-border bg-surface hover:bg-surface-muted text-muted'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(p.code)}
                              className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                            />
                            <div>
                              <div className="font-mono font-semibold">{p.code}</div>
                              {p.description && (
                                <div className="text-[11px] opacity-80 mt-0.5">{p.description}</div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Link
              href="/app/roles"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
