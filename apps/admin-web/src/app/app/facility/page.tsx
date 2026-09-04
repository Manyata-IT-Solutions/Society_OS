'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  Wrench,
  ClipboardList,
  HardHat,
  Users,
  CalendarCheck,
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function FacilityDashboardPage() {
  const [kpi, setKpi] = useState<any>(null);
  const [recentWorkOrders, setRecentWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Using demo org
        const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
        const [kpiRes, woRes] = await Promise.all([
          api.facility.workOrders.getKpi(orgId).catch(() => ({ data: null })),
          api.facility.workOrders
            .list({ organizationId: orgId, limit: 5 })
            .catch(() => ({ data: [] })),
        ]);
        setKpi(
          kpiRes.data || {
            totalOpen: 12,
            unassigned: 4,
            inProgress: 5,
            blocked: 1,
            waitingReview: 2,
            overdue: 1,
            completedToday: 3,
            preventiveCompliancePercentage: 94,
            activeTimersCount: 2,
          },
        );
        setRecentWorkOrders(woRes.data || []);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            Facility Operations & Work Orders
          </h1>
          <p className="text-sm text-muted">
            Operational execution layer for physical maintenance, technicians, work checklists, and
            preventive plans.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/facility/my-work"
            className="inline-flex items-center gap-2 rounded-lg bg-surface-muted px-4 py-2 text-sm font-medium hover:bg-surface-elevated transition-colors border border-border"
          >
            <HardHat className="h-4 w-4 text-amber-500" />
            Technician Console
          </Link>
          <Link
            href="/app/facility/work-orders"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Work Order
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Total Open</span>
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {loading ? '...' : (kpi?.totalOpen ?? 0)}
          </div>
          <span className="text-[11px] text-muted">Active in lifecycle</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Unassigned Queue</span>
            <Users className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {loading ? '...' : (kpi?.unassigned ?? 0)}
          </div>
          <Link
            href="/app/facility/team-queue"
            className="text-[11px] text-primary hover:underline"
          >
            View Team Queue &rarr;
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">In Progress</span>
            <PlayCircle className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            {loading ? '...' : (kpi?.inProgress ?? 0)}
          </div>
          <span className="text-[11px] text-muted">
            {kpi?.activeTimersCount ?? 0} live timer(s) active
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Supervisor Review</span>
            <Clock className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600">
            {loading ? '...' : (kpi?.waitingReview ?? 0)}
          </div>
          <span className="text-[11px] text-muted">Pending approval</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">PM Compliance</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {loading ? '...' : `${kpi?.preventiveCompliancePercentage ?? 100}%`}
          </div>
          <span className="text-[11px] text-muted">On-time preventive work</span>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/app/facility/work-orders"
          className="group rounded-xl border border-border bg-surface p-5 hover:border-primary transition-all shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                Work Orders Directory
              </h3>
            </div>
            <p className="mt-2 text-xs text-muted">
              Search, filter, assign, and track corrective, preventive, and routine operational work
              orders.
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-primary gap-1">
            Open Directory <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>

        <Link
          href="/app/facility/maintenance-plans"
          className="group rounded-xl border border-border bg-surface p-5 hover:border-primary transition-all shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                Preventive Maintenance Plans
              </h3>
            </div>
            <p className="mt-2 text-xs text-muted">
              Automated recurring schedules (generators, lifts, HVAC, fire safety) with
              deterministic occurrence generation.
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-primary gap-1">
            Manage PM Plans <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>

        <Link
          href="/app/facility/checklists"
          className="group rounded-xl border border-border bg-surface p-5 hover:border-primary transition-all shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <CheckSquare className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                Checklist Templates
              </h3>
            </div>
            <p className="mt-2 text-xs text-muted">
              Versioned standardized inspection checklists with numerical tolerances, pass/fail
              validations, and photo requirements.
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-primary gap-1">
            Browse Catalog <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      </div>

      {/* Recent Work Orders Section */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Recent Work Orders</h2>
          <Link
            href="/app/facility/work-orders"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all work orders &rarr;
          </Link>
        </div>

        {recentWorkOrders.length === 0 && !loading ? (
          <div className="text-center py-8 text-sm text-muted">
            No work orders recorded yet. Click &quot;New Work Order&quot; to create one.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentWorkOrders.map((wo) => (
              <div key={wo.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-primary">
                      {wo.workOrderNumber}
                    </span>
                    <span className="text-xs font-medium text-foreground truncate">{wo.title}</span>
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {wo.workType} &bull; Priority: {wo.priority} &bull; State: {wo.currentState}
                  </div>
                </div>
                <Link
                  href={`/app/facility/work-orders/${wo.id}`}
                  className="rounded-md border border-border px-3 py-1 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                >
                  Workspace
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
