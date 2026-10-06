'use client';
import { useState } from 'react';
import { PieChart } from 'lucide-react';

export default function PortfolioAnalyticsPage() {
  const [items] = useState([
    { name: 'South India Residential Portfolio (Tower A & B)', units: 120, collectionEff: '95.8%', sla: '96.5%', energyPerUnit: '142 kWh' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Portfolio Benchmarks & Comparisons</h1>
        <p className="text-sm text-muted">Cross-community normalized comparisons, unit-level ratios, and financial metrics.</p>
      </div>

      <div className="border border-border rounded-lg bg-surface divide-y divide-border">
        {items.map((it, idx) => (
          <div key={idx} className="p-4 flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-foreground text-sm">{it.name}</h4>
              <div className="text-xs text-muted flex gap-4 mt-1">
                <span>Units: {it.units}</span>
                <span>Energy: {it.energyPerUnit} / unit</span>
              </div>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded">Collections: {it.collectionEff}</span>
              <span className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded">SLA: {it.sla}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
