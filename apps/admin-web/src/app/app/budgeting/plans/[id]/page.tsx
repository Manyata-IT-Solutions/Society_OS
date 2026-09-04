'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle,
  Play,
  Copy,
  AlertCircle,
  Clock,
  DollarSign,
} from 'lucide-react';

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBudget();
  }, [id]);

  async function loadBudget() {
    try {
      setLoading(true);
      const res = await api.budgeting.getBudget(id);
      setBudget(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await api.budgeting.submitBudget(id);
      await loadBudget();
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.budgeting.approveBudget(id);
      await loadBudget();
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      await api.budgeting.activateBudget(id);
      await loadBudget();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !budget) {
    return <div className="p-8 text-center text-xs text-muted">Loading budget workbook...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <Link
            href="/app/budgeting/plans"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Operating Plans
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span className="font-mono text-primary">{budget.budgetNumber}</span>
            <span>— {budget.name}</span>
          </h1>
          <p className="text-xs text-muted">
            Fiscal Year: {budget.fiscalYear?.name} | Currency: {budget.currency} | Scenario: {budget.scenarioType} | Status:{' '}
            <span className="font-semibold text-foreground">{budget.status}</span>
          </p>
        </div>

        {/* Workflow Actions */}
        <div className="flex items-center gap-2">
          {budget.status === 'DRAFT' && (
            <button
              onClick={handleSubmit}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Play className="h-4 w-4" /> Submit for Review
            </button>
          )}
          {(budget.status === 'SUBMITTED' || budget.status === 'UNDER_REVIEW') && (
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-info px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-info/90 transition-colors"
            >
              <CheckCircle className="h-4 w-4" /> Approve Plan
            </button>
          )}
          {budget.status === 'APPROVED' && (
            <button
              onClick={handleActivate}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-success/90 transition-colors"
            >
              <CheckCircle className="h-4 w-4" /> Activate as Official Plan
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs font-medium text-muted">Total Revenue Plan</div>
          <div className="text-xl font-bold text-success mt-1">
            ₹{Number(budget.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs font-medium text-muted">Total OPEX Plan</div>
          <div className="text-xl font-bold text-foreground mt-1">
            ₹{Number(budget.totalOpex || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs font-medium text-muted">Total CAPEX Plan</div>
          <div className="text-xl font-bold text-warning mt-1">
            ₹{Number(budget.totalCapex || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs font-medium text-muted">Net Budget Surplus / (Deficit)</div>
          <div className="text-xl font-bold text-primary mt-1">
            ₹{Number(budget.totalNetBudget || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Workbook Grid */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surface-muted/30 font-semibold text-xs text-foreground flex items-center justify-between">
          <span>Budget Line Items & Monthly Spreads</span>
          <span className="text-muted text-[11px] font-normal">
            Authoritative Plan Matrix ({budget.lines?.length || 0} Lines)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface-muted/50 text-muted uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Account Code & Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Cost Center / Fund</th>
                <th className="px-4 py-3">Original Plan</th>
                <th className="px-4 py-3">Current Approved</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Available Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {budget.lines?.map((line: any) => {
                const proj = line.balanceProjections?.[0];
                const available = proj ? Number(proj.availableBudget) : Number(line.currentAmount || line.annualAmount);
                return (
                  <tr key={line.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-muted">{line.lineNumber}</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="font-mono text-xs">{line.account?.accountCode}</div>
                      <div className="text-[11px] text-muted">{line.account?.name || line.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {line.lineType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted text-[11px]">
                      {line.costCenter?.name || line.fund?.name || 'General Operations'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      ₹{Number(line.annualAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      ₹{Number(line.currentAmount || line.annualAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-muted text-[11px]">{line.allocationMethod}</td>
                    <td className="px-4 py-3 font-bold text-success">
                      ₹{available.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
