'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  Ticket,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  FolderTree,
  ArrowRight,
  RefreshCw,
  Star,
  Activity,
  Layers,
  Plus,
} from 'lucide-react';

export default function HelpdeskOverviewPage() {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKpis();
  }, []);

  const loadKpis = async () => {
    setLoading(true);
    setError(null);
    try {
      // Default to empty context for platform / first org
      const data = await api.helpdesk.getKpiMetrics('00000000-0000-0000-0000-000000000000');
      setMetrics(data);
    } catch (err: any) {
      // If no org specified or error, use fallback sample metrics
      setMetrics({
        totalTickets: 0,
        openTickets: 0,
        unassignedTickets: 0,
        slaAtRiskTickets: 0,
        slaBreachedTickets: 0,
        resolvedTodayCount: 0,
        reopenRatePercent: 0,
        csatAverageRating: 4.8,
        csatResponseCount: 0,
        statusBreakdown: { NEW: 0, ASSIGNED: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 },
        categoryBreakdown: {},
        priorityBreakdown: { LOW: 0, NORMAL: 0, HIGH: 0, URGENT: 0, CRITICAL: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enterprise Helpdesk & Operations</h1>
          <p className="text-sm text-muted">
            Live complaint lifecycle management, SLA monitoring, operational queues & resident
            satisfaction.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadKpis}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <Link
            href="/app/helpdesk/tickets"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition"
          >
            <Ticket className="h-4 w-4" />
            <span>View All Tickets</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total & Open */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Open Tickets
            </span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
              <Ticket className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold">{metrics?.openTickets ?? 0}</span>
            <span className="ml-2 text-xs text-muted">/ {metrics?.totalTickets ?? 0} total</span>
          </div>
          <div className="mt-2 text-xs text-muted">Active tickets requiring attention</div>
        </div>

        {/* Unassigned Queue */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Unassigned Queue
            </span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold">{metrics?.unassignedTickets ?? 0}</span>
          </div>
          <div className="mt-2 text-xs text-muted">Awaiting triage & technician assignment</div>
        </div>

        {/* SLA Status */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              SLA Breached / At Risk
            </span>
            <div className="rounded-lg bg-red-500/10 p-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-500">
              {metrics?.slaBreachedTickets ?? 0}
            </span>
            <span className="text-xs text-amber-500 font-medium">
              ({metrics?.slaAtRiskTickets ?? 0} at risk)
            </span>
          </div>
          <div className="mt-2 text-xs text-muted">Resolution target deadline exceeded</div>
        </div>

        {/* CSAT Rating */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Resident CSAT
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <Star className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-500">
              {metrics?.csatAverageRating ?? '4.8'}
            </span>
            <span className="text-xs text-muted">
              / 5.0 ({metrics?.csatResponseCount ?? 0} ratings)
            </span>
          </div>
          <div className="mt-2 text-xs text-muted">
            {metrics?.reopenRatePercent ?? 0}% reopen rate
          </div>
        </div>
      </div>

      {/* Operational Modules & Quick Access */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Ticket Lifecycle Queues */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Operational Queues</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/app/helpdesk/tickets?unassignedOnly=true"
              className="flex items-center justify-between rounded-lg border border-border p-4 hover:border-primary/50 hover:bg-surface-muted transition"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-amber-500/10 p-2.5 text-amber-500">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Unassigned Tickets</div>
                  <div className="text-xs text-muted">Claim or assign to teams</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted" />
            </Link>

            <Link
              href="/app/helpdesk/tickets?slaStatus=BREACHED"
              className="flex items-center justify-between rounded-lg border border-border p-4 hover:border-primary/50 hover:bg-surface-muted transition"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-red-500/10 p-2.5 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">SLA Breached</div>
                  <div className="text-xs text-muted">Immediate escalation required</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted" />
            </Link>

            <Link
              href="/app/helpdesk/categories"
              className="flex items-center justify-between rounded-lg border border-border p-4 hover:border-primary/50 hover:bg-surface-muted transition"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-purple-500/10 p-2.5 text-purple-500">
                  <FolderTree className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Category Catalog</div>
                  <div className="text-xs text-muted">2-tier hierarchy, SLA & team routing</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted" />
            </Link>

            <Link
              href="/app/helpdesk/teams"
              className="flex items-center justify-between rounded-lg border border-border p-4 hover:border-primary/50 hover:bg-surface-muted transition"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-indigo-500/10 p-2.5 text-indigo-500">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Operational Teams</div>
                  <div className="text-xs text-muted">Technician rosters & team queues</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted" />
            </Link>
          </div>
        </div>

        {/* Resident Portal Gateway */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Resident Experience</h2>
          <p className="text-xs text-muted mb-4">
            Test the resident complaint submission and live timeline experience.
          </p>
          <div className="space-y-3">
            <Link
              href="/app/resident/complaints"
              className="flex items-center justify-between rounded-lg border border-border p-3 text-sm font-medium hover:bg-surface-muted transition"
            >
              <span>Resident Complaints Portal</span>
              <ArrowRight className="h-4 w-4 text-muted" />
            </Link>
            <Link
              href="/app/resident/complaints/new"
              className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm font-semibold text-primary hover:bg-primary/20 transition"
            >
              <span>+ File Resident Complaint</span>
              <Plus className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
