'use client';
import { useState } from 'react';
import { Zap, Droplets, Gauge, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export default function UtilitiesDashboardPage() {
  const [summary] = useState({
    activeServices: 4,
    totalMeters: 128,
    openAnomalies: 2,
    openOutages: 0,
    solarSharePct: 20.0,
    recycledWaterPct: 15.0,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Enterprise Utilities & Sustainability</h1>
        <p className="text-sm text-muted">Electricity, Water, DG, Solar, Gas, STP/WTP, Commercial Metering, and Carbon Accounting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Active Services</span>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.activeServices}</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Commercial Meters</span>
            <Gauge className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.totalMeters}</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Solar Share</span>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.solarSharePct}%</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Recycled Water</span>
            <Droplets className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.recycledWaterPct}%</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Open Anomalies</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.openAnomalies}</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Active Outages</span>
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.openOutages}</div>
        </div>
      </div>
    </div>
  );
}
