'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { FileSpreadsheet, Plus, Copy, CheckCircle, ArrowRight } from 'lucide-react';

export default function BudgetPlansPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const ents = await api.finance.getAccountingEntities();
        setEntities(ents || []);
        if (ents && ents.length > 0) {
          setSelectedEntity(ents[0].id);
          const bList = await api.budgeting.getBudgets(ents[0].id);
          setBudgets(bList || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleEntityChange = async (eId: string) => {
    setSelectedEntity(eId);
    setLoading(true);
    try {
      const bList = await api.budgeting.getBudgets(eId);
      setBudgets(bList || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Annual Operating Plans & Budgets
          </h1>
          <p className="text-sm text-muted">
            Manage multi-scenario operating budgets, prepare drafts, submit for review, approve, and activate official plans.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedEntity}
            onChange={(e) => handleEntityChange(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground"
          >
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.name} ({ent.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-surface-muted/30 font-semibold text-xs text-muted uppercase">
          Master Budget Records ({budgets.length})
        </div>
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-surface-muted/50 text-muted uppercase font-semibold">
            <tr>
              <th className="px-6 py-3">Number</th>
              <th className="px-6 py-3">Plan Name</th>
              <th className="px-6 py-3">Fiscal Year</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Scenario</th>
              <th className="px-6 py-3">Total Opex</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {budgets.map((b) => (
              <tr key={b.id} className="hover:bg-surface-muted/50 transition-colors">
                <td className="px-6 py-3.5 font-mono font-medium text-foreground">{b.budgetNumber}</td>
                <td className="px-6 py-3.5 font-medium text-foreground">{b.name}</td>
                <td className="px-6 py-3.5 text-muted">{b.fiscalYear?.name || 'FY 2026-27'}</td>
                <td className="px-6 py-3.5">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {b.budgetType}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-muted">{b.scenarioType}</td>
                <td className="px-6 py-3.5 font-semibold text-foreground">
                  ₹{Number(b.totalOpex || 0).toLocaleString('en-IN')}
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
                    className="font-semibold text-primary hover:underline"
                  >
                    Open Workbook →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
