'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { TrendingUp, AlertTriangle, CheckCircle2, MessageSquarePlus } from 'lucide-react';

export default function VarianceAnalysisPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState('');
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const ents = await api.finance.getAccountingEntities();
      if (ents && ents.length > 0) {
        const bList = await api.budgeting.getBudgets(ents[0].id);
        setBudgets(bList || []);
        if (bList && bList.length > 0) {
          setSelectedBudgetId(bList[0].id);
          const rep = await api.budgeting.getVarianceReport(bList[0].id);
          setReport(rep || []);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleBudgetChange = async (bId: string) => {
    setSelectedBudgetId(bId);
    setLoading(true);
    try {
      const rep = await api.budgeting.getVarianceReport(bId);
      setReport(rep || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Budget vs Actual Variance Analysis
          </h1>
          <p className="text-sm text-muted">
            Multi-dimensional variance reporting with sign conventions, material variance thresholds, and explanation logs.
          </p>
        </div>
        <select
          value={selectedBudgetId}
          onChange={(e) => handleBudgetChange(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground"
        >
          {budgets.map((b) => (
            <option key={b.id} value={b.id}>
              {b.budgetNumber} — {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-surface-muted/30 font-semibold text-xs text-muted uppercase">
          Variance Report Matrix ({report.length} Line Items)
        </div>
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-surface-muted/50 text-muted uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Budget Plan</th>
              <th className="px-4 py-3">Actual Spent / Earned</th>
              <th className="px-4 py-3">Variance Amount</th>
              <th className="px-4 py-3">Variance %</th>
              <th className="px-4 py-3">Performance</th>
              <th className="px-4 py-3">Material Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {report.map((row, idx) => (
              <tr key={idx} className="hover:bg-surface-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">
                  <span className="font-mono text-xs">{row.accountCode}</span> — {row.accountName}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {row.lineType}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">
                  ₹{Number(row.budgetAmount).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">
                  ₹{Number(row.actualAmount).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 font-bold">
                  ₹{Number(row.varianceAmount).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 font-mono">{Number(row.variancePercent).toFixed(1)}%</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                      row.classification === 'FAVORABLE'
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {row.classification}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {row.isMaterial ? (
                    <span className="rounded bg-warning/10 text-warning px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1 w-fit">
                      <AlertTriangle className="h-3 w-3" /> Material Variance
                    </span>
                  ) : (
                    <span className="text-muted text-[10px]">Within Threshold</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
