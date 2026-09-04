'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { CalendarCheck, Plus, Play, Pause, Archive, Eye, Zap } from 'lucide-react';

export default function MaintenancePlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewSchedule, setPreviewSchedule] = useState<string[] | null>(null);

  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';

  async function loadPlans() {
    try {
      setLoading(true);
      const res = await api.facility.maintenancePlans.list({
        organizationId: orgId,
        communityId: commId,
      });
      setPlans(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  async function handleActivate(id: string) {
    try {
      await api.facility.maintenancePlans.activate(id);
      loadPlans();
    } catch (err: any) {
      alert(err.message || 'Error activating plan');
    }
  }

  async function handlePause(id: string) {
    try {
      await api.facility.maintenancePlans.pause(id);
      loadPlans();
    } catch (err: any) {
      alert(err.message || 'Error pausing plan');
    }
  }

  async function handleGenerate(id: string) {
    try {
      await api.facility.maintenancePlans.generate(id);
      alert('Work order generated successfully!');
      loadPlans();
    } catch (err: any) {
      alert(err.message || 'Error generating work order');
    }
  }

  async function handlePreview(id: string) {
    try {
      const res = await api.facility.maintenancePlans.preview(id, 5);
      setPreviewSchedule(res.data || []);
    } catch (err: any) {
      alert(err.message || 'Error previewing schedule');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            Preventive Maintenance Plans
          </h1>
          <p className="text-sm text-muted">
            Configure automated recurring maintenance schedules for critical infrastructure assets.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted border-b border-border text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Plan Code</th>
                <th className="px-4 py-3">Name & Category</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Next Run</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">
                    Loading plans...
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">
                    No preventive maintenance plans configured.
                  </td>
                </tr>
              ) : (
                plans.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-primary">{p.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{p.name}</div>
                      <div className="text-xs text-muted">{p.workCategoryName || 'General'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground">
                      {p.scheduleType}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-surface-muted text-muted'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {p.nextRunAt ? new Date(p.nextRunAt).toLocaleString() : 'Not scheduled'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handlePreview(p.id)}
                        className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-surface-muted"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleGenerate(p.id)}
                        className="rounded-md bg-primary/10 text-primary px-2.5 py-1 text-xs font-semibold hover:bg-primary/20"
                      >
                        Run Now
                      </button>
                      {p.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handlePause(p.id)}
                          className="rounded-md bg-amber-500/10 text-amber-600 px-2.5 py-1 text-xs font-semibold hover:bg-amber-500/20"
                        >
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(p.id)}
                          className="rounded-md bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-xs font-semibold hover:bg-emerald-500/20"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-foreground">Upcoming Occurrences Preview</h2>
            <div className="space-y-2 text-xs">
              {previewSchedule.map((dateStr, idx) => (
                <div key={idx} className="p-2 rounded bg-surface-muted font-mono text-foreground">
                  #{idx + 1}: {new Date(dateStr).toUTCString()}
                </div>
              ))}
            </div>
            <button
              onClick={() => setPreviewSchedule(null)}
              className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
