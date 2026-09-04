'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  PieChart,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  Activity,
} from 'lucide-react';

export default function BudgetingDashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any>(null);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load default entity & active budgets
        const entityRes = await api.finance.getAccountingEntities();
        const entityId = entityRes && entityRes.length > 0 ? entityRes[0].id : '';

        if (entityId) {
          const [kpisRes, pipeRes, bRes] = await Promise.all([
            api.budgeting.getDashboardKpis(entityId),
            api.budgeting.getSpendPipeline(entityId),
            api.budgeting.getBudgets(entityId),
          ]);
          setKpis(kpisRes);
          setPipeline(pipeRes);
          setBudgets(bRes || []);
        }
      } catch (err) {
        console.error('Failed to load budgeting dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PieChart className="h-6 w-6 text-primary" />
            Enterprise Budgeting & Financial Control
          </h1>
          <p className="text-sm text-muted">
            Annual Operating Plans (AOP), Commitment Control, Budget vs Actual, CAPEX, & Forecasting
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/app/budgeting/plans"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Operating Plans
          </Link>
          <Link
            href="/app/budgeting/control"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted transition-colors"
          >
            <ShieldAlert className="h-4 w-4 text-warning" />
            Spend Control
          </Link>
          <Link
            href="/app/budgeting/variance"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted transition-colors"
          >
            <TrendingUp className="h-4 w-4 text-info" />
            Variance Analysis
          </Link>
        </div>
      </div>

      {/* KPI Cards Row 1: Opex & Financial Control */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Approved Operating Budget</span>
            <span className="rounded-md bg-primary/10 p-2 text-primary">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              ₹{(kpis?.currentApprovedBudget || 18000000).toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-xs text-muted flex items-center gap-1">
              <span>Original Plan: ₹{(kpis?.totalAnnualBudget || 18000000).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Actual Spent YTD (GL)</span>
            <span className="rounded-md bg-info/10 p-2 text-info">
              <Activity className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              ₹{(kpis?.actualYtd || 0).toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-xs text-muted">
              Utilization: {(kpis?.utilizationPercent || 0).toFixed(1)}% of annual budget
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Active Spend Pipeline</span>
            <span className="rounded-md bg-warning/10 p-2 text-warning">
              <ShieldAlert className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              ₹{((kpis?.commitments || 0) + (kpis?.reservations || 0)).toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-xs text-muted">
              PO Commitments: ₹{(kpis?.commitments || 0).toLocaleString('en-IN')} | PR Res: ₹{(kpis?.reservations || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Remaining Available Budget</span>
            <span className="rounded-md bg-success/10 p-2 text-success">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-success">
              ₹{(kpis?.availableBudget || 18000000).toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-xs text-muted">
              Uncommitted funds available for spend
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row 2: Revenue, CAPEX, & Funds */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Revenue & Collection Efficiency</span>
            <span className="text-xs text-primary font-medium">Phase 14 Sync</span>
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted">Budgeted Maintenance:</span>
              <span className="font-semibold text-foreground">₹{(kpis?.revenueBudget || 24000000).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Actual Billed:</span>
              <span className="font-semibold text-foreground">₹{(kpis?.revenueBilled || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Collected Cash:</span>
              <span className="font-semibold text-success">₹{(kpis?.revenueCollected || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between font-bold">
              <span>Collection Efficiency:</span>
              <span className="text-primary">{(kpis?.collectionEfficiencyPercent || 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">CAPEX Initiatives</span>
            <Link href="/app/budgeting/capex" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted">Approved CAPEX:</span>
              <span className="font-semibold text-foreground">₹{(kpis?.capexBudget || 3500000).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Committed Contracts:</span>
              <span className="font-semibold text-warning">₹{(kpis?.capexCommitted || 2000000).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Actual Capitalized:</span>
              <span className="font-semibold text-info">₹{(kpis?.capexActual || 800000).toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between font-bold">
              <span>Active Projects:</span>
              <span className="text-foreground">2 Major Overhauls</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Fund Planning & Reserves</span>
            <Link href="/app/budgeting/fund-plans" className="text-xs text-primary hover:underline flex items-center gap-1">
              View Plans <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted">Sinking Fund Opening:</span>
              <span className="font-semibold text-foreground">₹50,00,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Planned Additions:</span>
              <span className="font-semibold text-success">+₹24,00,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Planned Capital Usage:</span>
              <span className="font-semibold text-destructive">-₹35,00,000</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between font-bold">
              <span>Projected Closing:</span>
              <span className="text-primary">₹39,00,000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Operating Plans Table */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface-muted/30">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Active & Approved Annual Operating Plans</h2>
          </div>
          <Link
            href="/app/budgeting/plans"
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            Manage All Budgets <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface-muted/50 text-muted uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Budget Number</th>
                <th className="px-6 py-3">Plan Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Total Opex</th>
                <th className="px-6 py-3">Total Revenue</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {budgets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted">
                    No operating plans found. Create your first Annual Operating Plan.
                  </td>
                </tr>
              ) : (
                budgets.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-medium text-foreground">{b.budgetNumber}</td>
                    <td className="px-6 py-3.5 font-medium text-foreground">{b.name}</td>
                    <td className="px-6 py-3.5">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {b.budgetType}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-foreground">
                      ₹{Number(b.totalOpex || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-success">
                      ₹{Number(b.totalRevenue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                          b.status === 'ACTIVE'
                            ? 'bg-success/10 text-success'
                            : b.status === 'APPROVED'
                              ? 'bg-info/10 text-info'
                              : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/app/budgeting/plans/${b.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        Open Workbook →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
