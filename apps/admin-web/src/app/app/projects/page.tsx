'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { HardHat, DollarSign, Activity, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function ProjectsDashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const orgId = orgList[0].id;
          const kpiData = await api.projects.getPortfolioKpis(orgId);
          const prjList = await api.projects.getProjects({ organizationId: orgId });
          setKpis(kpiData);
          setProjects(prjList || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading Projects Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <HardHat className="h-6 w-6 text-primary" />
          Enterprise Projects & CAPEX Execution
        </h1>
        <p className="text-sm text-muted">
          Real-time oversight of capital projects, BOQ measurements, contractor progress certificates, and asset handovers.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Approved Budget</span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            ₹{Number(kpis?.totalApprovedBudget || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-muted">
            Across {kpis?.totalProjectsCount || 0} active & planned projects
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Committed & Actual Spend</span>
            <Activity className="h-4 w-4 text-info" />
          </div>
          <div className="mt-2 text-2xl font-bold text-info">
            ₹{Number(kpis?.totalActualSpend || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-muted">
            Committed: ₹{Number(kpis?.totalCommitted || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Active Execution</span>
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div className="mt-2 text-2xl font-bold text-warning">
            {kpis?.activeProjectsCount || 0} Projects
          </div>
          <div className="mt-1 text-xs text-muted">
            {kpis?.delayedProjectsCount || 0} flagged as delayed
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Forecast Available</span>
            <CheckCircle className="h-4 w-4 text-success" />
          </div>
          <div className="mt-2 text-2xl font-bold text-success">
            ₹{Number(kpis?.totalAvailableBudget || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-muted">Under strict budget control</div>
        </div>
      </div>

      {/* Active Projects List */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Active Capital Projects</h2>
          <span className="text-xs text-muted">{projects.length} Total Projects</span>
        </div>

        <div className="divide-y divide-border">
          {projects.map((prj) => (
            <div key={prj.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold font-mono">
                    {prj.projectNumber}
                  </span>
                  <span className="rounded bg-surface-muted text-foreground px-2 py-0.5 text-[10px] font-semibold">
                    {prj.projectType}
                  </span>
                  <span className="rounded bg-info/10 text-info px-2 py-0.5 text-[10px] font-semibold">
                    {prj.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">{prj.name}</h3>
                <p className="text-xs text-muted line-clamp-1">{prj.description}</p>
              </div>

              <div className="flex items-center gap-6 text-xs">
                <div>
                  <div className="text-muted text-[10px]">Approved Budget</div>
                  <div className="font-bold text-foreground">
                    ₹{Number(prj.approvedBudget).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-muted text-[10px]">Actual Spend (GL)</div>
                  <div className="font-bold text-info">
                    ₹{Number(prj.financialSummary?.actualGl || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <a
                  href={`/app/projects/${prj.id}`}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Workspace
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
