'use client';
import { useEffect, useState } from 'react';
import { LineChart, DollarSign, CheckCircle2, AlertCircle, Wrench, Shield, Zap } from 'lucide-react';

export default function ExecutiveOverviewPage() {
  const [lastUpdated, setLastUpdated] = useState('Loading...');
  const [overview] = useState({
    communitiesCount: 1,
    totalUnits: 120,
    activeOccupancyPct: 94.2,
    collectionEfficiencyPct: 95.8,
    totalBilled: 1250000,
    totalCollected: 1197500,
    outstandingReceivables: 52500,
    ticketSlaCompliancePct: 96.5,
    criticalAssetsDown: 0,
    activeIncidents: 0,
    safetyReadinessScore: 98.0,
  });

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LineChart className="h-6 w-6 text-emerald-500" /> Executive Command Center
          </h1>
          <p className="text-sm text-muted">Cross-domain enterprise intelligence, financial health, SLA adherence, and operational readiness.</p>
        </div>
        <div className="text-xs text-muted bg-surface px-3 py-1.5 rounded border border-border">
          Freshness: Real-time ({lastUpdated})
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between text-xs text-muted font-medium">
            <span>Collection Efficiency</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{overview.collectionEfficiencyPct}%</div>
          <p className="text-xs text-emerald-600 mt-1">₹{overview.totalCollected.toLocaleString()} collected of ₹{overview.totalBilled.toLocaleString()}</p>
        </div>

        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between text-xs text-muted font-medium">
            <span>Helpdesk SLA Compliance</span>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{overview.ticketSlaCompliancePct}%</div>
          <p className="text-xs text-muted mt-1">Target ≥ 90.0% (ON_TARGET)</p>
        </div>

        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between text-xs text-muted font-medium">
            <span>Critical Assets Out of Service</span>
            <Wrench className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{overview.criticalAssetsDown}</div>
          <p className="text-xs text-emerald-600 mt-1">All high-criticality assets operational</p>
        </div>

        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between text-xs text-muted font-medium">
            <span>Safety Readiness Score</span>
            <Shield className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{overview.safetyReadinessScore}%</div>
          <p className="text-xs text-indigo-600 mt-1">All NOCs and playbooks active</p>
        </div>
      </div>
    </div>
  );
}
