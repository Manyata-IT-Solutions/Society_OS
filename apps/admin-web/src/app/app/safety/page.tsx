'use client';
import { useState } from 'react';
import { Siren, AlertCircle, Flame, Users, AlertTriangle, CheckSquare } from 'lucide-react';

export default function CommandCenterPage() {
  const [summary] = useState({
    activeIncidents: 1,
    openSOS: 0,
    activeEvacuations: 0,
    openHazards: 1,
    openCAPA: 2,
    emergencyReadinessScore: 94.5,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Siren className="h-6 w-6 text-rose-500 animate-pulse" /> Emergency Command Center
          </h1>
          <p className="text-sm text-muted">Real-time emergency monitoring, SOS triage, incident command, and community safety status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Active Incidents</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.activeIncidents}</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Open SOS</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.openSOS}</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Active Evacuations</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.activeEvacuations}</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Open Hazards</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.openHazards}</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Open CAPA</span>
            <CheckSquare className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.openCAPA}</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Readiness Score</span>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-medium">{summary.emergencyReadinessScore}%</span>
          </div>
          <div className="text-2xl font-bold mt-2 text-emerald-600">PASS</div>
        </div>
      </div>
    </div>
  );
}
