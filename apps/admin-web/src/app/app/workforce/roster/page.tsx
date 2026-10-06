'use client';
import React, { useState } from 'react';
import { Calendar, Users, Plus, X } from 'lucide-react';

export default function WorkforceRosterPage() {
  const [rosters, setRosters] = useState([
    { id: '1', period: 'Apr 2026 - W1', dates: '01-Apr to 07-Apr 2026', totalShifts: 84, workersAssigned: 12, status: 'PUBLISHED' },
    { id: '2', period: 'Apr 2026 - W2', dates: '08-Apr to 14-Apr 2026', totalShifts: 84, workersAssigned: 12, status: 'DRAFT' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ period: '', dates: '', totalShifts: '84' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.period) return;
    setRosters((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        period: form.period.trim(),
        dates: form.dates.trim() || 'Upcoming Week',
        totalShifts: parseInt(form.totalShifts) || 84,
        workersAssigned: 12,
        status: 'DRAFT',
      },
    ]);
    setIsModalOpen(false);
    setForm({ period: '', dates: '', totalShifts: '84' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shift Rosters & Scheduling</h1>
          <p className="text-sm text-muted">Weekly and monthly shift matrices, rotational shift planning, and rest days.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Create Roster Period
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rosters.map((r) => (
          <div key={r.id} className="p-5 border border-border rounded-xl bg-surface space-y-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{r.period}</h3>
                <p className="text-xs text-muted font-mono mt-0.5">{r.dates}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${r.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                {r.status}
              </span>
            </div>
            <div className="flex gap-4 text-xs text-muted pt-2 border-t border-border">
              <span>Shifts: <strong>{r.totalShifts}</strong></span>
              <span>Workers Assigned: <strong>{r.workersAssigned}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Create Roster Schedule Period</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Period Label *</label>
                <input required placeholder="e.g. May 2026 - Week 1" type="text" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Date Range</label>
                <input placeholder="e.g. 01-May to 07-May 2026" type="text" value={form.dates} onChange={(e) => setForm({ ...form, dates: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Create Roster</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
