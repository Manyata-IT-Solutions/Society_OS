'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Layers } from 'lucide-react';

export default function CapexPlanningPage() {
  const [initiatives, setInitiatives] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const ents = await api.finance.getAccountingEntities();
        if (ents && ents.length > 0) {
          const bList = await api.budgeting.getBudgets(ents[0].id);
          const commId = bList?.[0]?.communityId || ents[0]?.communityId || ents[0]?.id;
          if (commId) {
            const list = await api.budgeting.getCapexInitiatives(commId);
            setInitiatives(list || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          CAPEX Planning & Infrastructure Overhauls
        </h1>
        <p className="text-sm text-muted">
          Track long-term capital replacement initiatives, physical milestone progress, and sinking fund allocations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {initiatives.map((item) => (
          <div key={item.id} className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold font-mono">
                  {item.code}
                </span>
                <h3 className="text-base font-bold text-foreground mt-1">{item.name}</h3>
                <p className="text-xs text-muted mt-0.5">{item.description}</p>
              </div>
              <span className="rounded bg-info/10 text-info px-2.5 py-1 text-xs font-semibold">
                {item.status}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Physical Progress</span>
                <span className="font-bold text-primary">{item.physicalProgressPercent}%</span>
              </div>
              <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${item.physicalProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Financials Grid */}
            <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 text-xs">
              <div>
                <div className="text-muted text-[10px]">Approved Budget</div>
                <div className="font-bold text-foreground mt-0.5">
                  ₹{Number(item.approvedBudget).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div className="text-muted text-[10px]">Committed</div>
                <div className="font-bold text-warning mt-0.5">
                  ₹{Number(item.committedCost).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div className="text-muted text-[10px]">Actual Capitalized</div>
                <div className="font-bold text-info mt-0.5">
                  ₹{Number(item.actualCost).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
