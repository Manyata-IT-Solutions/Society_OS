'use client';
import { useState } from 'react';
import { Calendar, Plus, X } from 'lucide-react';

export default function SafetyDrillsPage() {
  const [drills, setDrills] = useState([
    { id: '1', title: 'Q2 Full Society Fire Evacuation Drill', date: '2026-05-15', participants: 'All Residents & Staff', status: 'SCHEDULED' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', date: '2026-05-20', participants: 'All Residents & Staff' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setDrills((prev) => [
      ...prev,
      { id: String(prev.length + 1), title: form.title.trim(), date: form.date, participants: form.participants, status: 'SCHEDULED' },
    ]);
    setIsModalOpen(false);
    setForm({ title: '', date: '2026-05-20', participants: 'All Residents & Staff' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Safety Drills & Mock Scenarios</h1>
          <p className="text-sm text-muted">Fire evacuation exercises, earthquake response drills, and emergency muster rehearsals.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Plan Drill
        </button>
      </div>
      <div className="divide-y divide-border border border-border rounded-lg bg-surface shadow-sm">
        {drills.map((d) => (
          <div key={d.id} className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-foreground text-sm">{d.title}</h3>
              <p className="text-xs text-muted">Date: {d.date} • Scope: {d.participants}</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded font-semibold">{d.status}</span>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Plan Emergency Drill</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Drill Title *</label>
                <input required placeholder="e.g. Basement Flood Simulation" type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Scheduled Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Participant Scope</label>
                <input type="text" value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Save Drill Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
