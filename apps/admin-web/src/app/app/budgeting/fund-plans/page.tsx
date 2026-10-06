'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function FundPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const fyRes = await api.finance.getAccountingEntities();
      if (fyRes && fyRes.length > 0) {
        const fyList = await api.finance.getFiscalYears(fyRes[0].id);
        if (fyList && fyList.length > 0) {
          const fPlans = await api.budgeting.getFundPlans(fyList[0].id);
          setPlans(fPlans || []);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <PieChart className="h-6 w-6 text-primary" />
          Multi-Fund Ring-Fenced Planning
        </h1>
        <p className="text-sm text-muted">
          Long-term fund positions, statutory reserve contributions, and planned capital utilization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="font-mono text-xs text-primary font-bold">{p.fund?.code}</span>
                <h3 className="text-base font-bold text-foreground">{p.fund?.name}</h3>
              </div>
              <span className="rounded bg-primary/10 text-primary px-2.5 py-1 text-xs font-semibold">
                {p.fund?.fundType}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Opening Balance:</span>
                <span className="font-semibold text-foreground">₹{Number(p.openingAvailable).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-success">
                <span className="flex items-center gap-1"><ArrowUpRight className="h-3.5 w-3.5" /> Planned Additions:</span>
                <span className="font-semibold">+₹{Number(p.plannedContribution).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-destructive">
                <span className="flex items-center gap-1"><ArrowDownRight className="h-3.5 w-3.5" /> Planned Capital Usage:</span>
                <span className="font-semibold">-₹{Number(p.plannedUsage).toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-3 border-t border-border flex justify-between font-bold text-sm">
                <span>Projected Year-End Position:</span>
                <span className="text-primary">₹{Number(p.projectedClosing).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
