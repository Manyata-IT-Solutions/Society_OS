'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  ClipboardList,
  Plus,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';

export default function WorkOrdersListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWorkType, setFormWorkType] = useState('CORRECTIVE');
  const [formPriority, setFormPriority] = useState('NORMAL');
  const [submitting, setSubmitting] = useState(false);

  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';

  async function loadWorkOrders() {
    try {
      setLoading(true);
      const res = await api.facility.workOrders.list({
        organizationId: orgId,
        communityId: commId,
        search: search || undefined,
        currentState: statusFilter || undefined,
        priority: priorityFilter || undefined,
        workType: workTypeFilter || undefined,
      });
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkOrders();
  }, [statusFilter, priorityFilter, workTypeFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.facility.workOrders.create({
        organizationId: orgId,
        communityId: commId,
        title: formTitle,
        description: formDescription,
        workType: formWorkType,
        priority: formPriority,
      });
      setIsModalOpen(false);
      setFormTitle('');
      setFormDescription('');
      loadWorkOrders();
    } catch (err: any) {
      alert(err.message || 'Error creating work order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Work Orders Management
          </h1>
          <p className="text-sm text-muted">
            Manage corrective, preventive, inspection, and emergency work execution tasks across
            properties.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={api.facility.workOrders.getExportUrl(orgId, commId)}
            className="inline-flex items-center gap-2 rounded-lg bg-surface-muted px-4 py-2 text-sm font-medium hover:bg-surface-elevated transition-colors border border-border"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Work Order
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="h-4 w-4 text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by WO#, title, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadWorkOrders()}
            className="w-full rounded-lg border border-border bg-surface-muted pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">All States</option>
          <option value="DRAFT">Draft</option>
          <option value="PLANNED">Planned</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="PAUSED">Paused</option>
          <option value="BLOCKED">Blocked</option>
          <option value="SUPERVISOR_REVIEW">Supervisor Review</option>
          <option value="REWORK_REQUIRED">Rework Required</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
          <option value="CRITICAL">Critical</option>
        </select>

        <select
          value={workTypeFilter}
          onChange={(e) => setWorkTypeFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">All Work Types</option>
          <option value="CORRECTIVE">Corrective</option>
          <option value="PREVENTIVE">Preventive</option>
          <option value="INSPECTION">Inspection</option>
          <option value="ROUTINE">Routine</option>
          <option value="EMERGENCY">Emergency</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted border-b border-border text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3">WO Number</th>
                <th className="px-4 py-3">Title & Type</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assignee / Team</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    Loading work orders...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    No work orders match the criteria.
                  </td>
                </tr>
              ) : (
                items.map((wo) => (
                  <tr key={wo.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-primary">
                      {wo.workOrderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{wo.title}</div>
                      <div className="text-[11px] text-muted">
                        {wo.workType} &bull; {wo.categoryName || 'General'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          wo.priority === 'CRITICAL' || wo.priority === 'URGENT'
                            ? 'bg-rose-500/10 text-rose-500'
                            : wo.priority === 'HIGH'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-surface-muted text-muted'
                        }`}
                      >
                        {wo.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary">
                        {wo.currentState}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {wo.primaryAssigneeName ||
                        (wo.primaryTeamName ? `[Team] ${wo.primaryTeamName}` : 'Unassigned')}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {wo.dueAt ? new Date(wo.dueAt).toLocaleDateString() : 'None'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/app/facility/work-orders/${wo.id}`}
                        className="rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-surface-muted transition-colors"
                      >
                        Workspace &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-foreground">Create New Work Order</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Pump Room #2 Valve Leakage"
                  className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe physical work scope, tools needed, and safety requirements..."
                  className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Work Type</label>
                  <select
                    value={formWorkType}
                    onChange={(e) => setFormWorkType(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="CORRECTIVE">Corrective</option>
                    <option value="PREVENTIVE">Preventive</option>
                    <option value="INSPECTION">Inspection</option>
                    <option value="ROUTINE">Routine</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
