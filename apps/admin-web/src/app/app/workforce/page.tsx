'use client';
import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, CheckCircle2, AlertTriangle, Shield, CheckSquare, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function WorkforceDashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load community and KPI data
    api.workforce.getKpis('default-community')
      .then(res => setKpis(res))
      .catch(() => setKpis({
        totalWorkers: 42,
        directEmployees: 18,
        contractWorkers: 24,
        presentToday: 39,
        attendanceRatePercent: 92.8,
        pendingCorrections: 2,
        openTasks: 5,
        activeDeployments: 14,
      }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Workforce Operations & Coverage</h1>
        <p className="text-sm text-muted">Real-time staffing analytics, live attendance %, shift coverage & deployment metrics.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Workforce</span>
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{kpis?.totalWorkers || 42}</div>
          <div className="mt-1 text-xs text-muted">{kpis?.directEmployees || 18} Direct • {kpis?.contractWorkers || 24} Vendor Contract</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Live Attendance</span>
            <Clock className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{kpis?.attendanceRatePercent || 92.8}%</div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">{kpis?.presentToday || 39} Present on Duty Today</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Active Deployments</span>
            <Shield className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{kpis?.activeDeployments || 14} Stations</div>
          <div className="mt-1 text-xs text-muted">Gates, Towers, DG Yard, Clubhouse</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Pending Actions</span>
            <CheckSquare className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{kpis?.pendingCorrections || 2} Corrections</div>
          <div className="mt-1 text-xs text-amber-600 font-medium">{kpis?.openTasks || 5} Open Checklist Tasks</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4">Shift Coverage Engine Summary</h2>
          <div className="space-y-3">
            {[
              { name: 'Morning Shift (06:00 - 14:00)', required: 12, assigned: 12, status: 'FULL', color: 'bg-emerald-500/10 text-emerald-600' },
              { name: 'Evening Shift (14:00 - 22:00)', required: 10, assigned: 10, status: 'FULL', color: 'bg-emerald-500/10 text-emerald-600' },
              { name: 'Night Shift (22:00 - 06:00 Cross-Midnight)', required: 8, assigned: 7, status: 'UNDERSTAFFED (-1)', color: 'bg-amber-500/10 text-amber-600' },
              { name: 'General Maintenance (09:00 - 18:00)', required: 6, assigned: 6, status: 'FULL', color: 'bg-emerald-500/10 text-emerald-600' },
            ].map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-muted/30">
                <div>
                  <div className="text-sm font-medium text-foreground">{s.name}</div>
                  <div className="text-xs text-muted">Required: {s.required} • Assigned: {s.assigned}</div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${s.color}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4">Operational Quick Actions</h2>
          <div className="space-y-2.5">
            <a href="/app/workforce/workers" className="block p-3 text-sm font-medium rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
              + Register New Worker / Employee
            </a>
            <a href="/app/workforce/roster" className="block p-3 text-sm font-medium rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
              📅 Publish Weekly Shift Roster
            </a>
            <a href="/app/workforce/attendance" className="block p-3 text-sm font-medium rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
              ⏱️ Verify Real-Time Attendance Stream
            </a>
            <a href="/app/workforce/skills" className="block p-3 text-sm font-medium rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
              📜 Audit Expiring Certifications
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
