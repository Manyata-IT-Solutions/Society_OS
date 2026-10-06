'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Plus, RefreshCw, AlertCircle, XCircle, Tag } from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import type { RoleAssignmentResponseDto, RoleResponseDto } from '@community-os/contracts';

export default function RoleAssignmentsPage() {
  const [assignments, setAssignments] = useState<RoleAssignmentResponseDto[]>([]);
  const [roles, setRoles] = useState<RoleResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    roleId: '',
    scopeType: 'ORGANIZATION' as 'PLATFORM' | 'ORGANIZATION' | 'COMMUNITY' | 'OWN',
    scopeId: '',
  });

  const loadAssignments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [res, rolesRes] = await Promise.all([
        apiClient.iam.listRoleAssignments({ page, limit: 10 }),
        apiClient.iam.listRoles(),
      ]);
      setAssignments(res.data || []);
      setRoles(rolesRes.data || []);
      if (res.meta?.pagination) {
        setTotalPages(res.meta.pagination.totalPages || 1);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load role assignments.');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      await apiClient.iam.createRoleAssignment({
        userId: formData.userId.trim(),
        roleId: formData.roleId,
        scopeType: formData.scopeType,
        scopeId: formData.scopeId.trim() || undefined,
      });

      setIsModalOpen(false);
      setFormData({
        userId: '',
        roleId: '',
        scopeType: 'ORGANIZATION',
        scopeId: '',
      });
      loadAssignments();
    } catch (err) {
      setFormError((err as ApiClientError).message || 'Failed to assign role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to revoke this role assignment?')) return;
    try {
      await apiClient.iam.revokeRoleAssignment(assignmentId);
      loadAssignments();
    } catch (err) {
      alert((err as ApiClientError).message || 'Failed to revoke assignment.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scoped Role Assignments</h1>
          <p className="text-sm text-muted mt-1">
            Explicit role assignments bound to specific PLATFORM, ORGANIZATION, or COMMUNITY scopes.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Assign Role
        </button>
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
            Loading role assignments...
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-muted/50 mb-3" />
            <h3 className="text-base font-semibold">No role assignments found</h3>
            <p className="text-sm text-muted mt-1">
              Assign a role to a user within an explicit scope boundary.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/50 text-xs uppercase text-muted font-semibold">
              <tr>
                <th className="px-6 py-3.5">User ID</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Scope Level</th>
                <th className="px-6 py-3.5">Scope Target ID</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-surface-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-muted">{a.userId}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground">{a.role?.name || a.roleId}</div>
                    <div className="text-xs text-muted font-mono">{a.role?.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 rounded bg-surface-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                      <Tag className="h-3 w-3" />
                      {a.scopeType}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted">
                    {a.scopeId || 'Global (All Tenants)'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        a.status === 'ACTIVE'
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {a.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleRevoke(a.id)}
                        className="inline-flex items-center gap-1 rounded border border-destructive/30 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <XCircle className="h-3 w-3" />
                        Revoke
                      </button>
                    )}
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

      {/* Assign Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">Assign Role with Scope</h2>
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
                <label className="block text-xs font-semibold mb-1">Target User ID (UUID) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 font-mono text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Select Role *</label>
                <select
                  required
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose Role --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code}) [{r.scopeType}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Scope Level *</label>
                  <select
                    value={formData.scopeType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scopeType: e.target.value as any,
                      })
                    }
                    className="w-full rounded-md border border-border bg-background py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="ORGANIZATION">ORGANIZATION</option>
                    <option value="COMMUNITY">COMMUNITY</option>
                    <option value="PLATFORM">PLATFORM (Root Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Scope Target ID</label>
                  <input
                    type="text"
                    placeholder="Organization ID or Community ID"
                    value={formData.scopeId}
                    onChange={(e) => setFormData({ ...formData, scopeId: e.target.value })}
                    className="w-full rounded-md border border-border bg-background py-2 px-3 font-mono text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
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
                  {isSubmitting ? 'Assigning...' : 'Assign Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
