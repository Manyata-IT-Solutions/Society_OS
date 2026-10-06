'use client';
import { useState } from 'react';
import { Gauge } from 'lucide-react';

export default function MetricsCatalogPage() {
  const [metrics] = useState([
    { key: 'finance.collection_efficiency', name: 'Collection Efficiency', domain: 'BILLING', type: 'PERCENTAGE', formula: 'SUM(paid) / SUM(billed) * 100' },
    { key: 'helpdesk.sla_compliance', name: 'Ticket SLA Compliance Rate', domain: 'HELPDESK', type: 'PERCENTAGE', formula: 'COUNT(within_sla) / COUNT(total) * 100' },
    { key: 'assets.critical_down', name: 'Critical Assets Out of Service', domain: 'ASSETS', type: 'COUNT', formula: 'COUNT(status = OUT_OF_SERVICE)' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Semantic Metric Catalog</h1>
        <p className="text-sm text-muted">Governed business KPI definitions, formulas, grain semantics, and source dataset lineage.</p>
      </div>

      <div className="border border-border rounded-lg bg-surface divide-y divide-border">
        {metrics.map((m) => (
          <div key={m.key} className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 bg-surface-muted text-foreground rounded">{m.key}</span>
                <span className="font-semibold text-foreground text-sm">{m.name}</span>
              </div>
              <p className="text-xs text-muted font-mono mt-1">Formula: {m.formula}</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-indigo-500/10 text-indigo-600 rounded font-medium">{m.domain}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
