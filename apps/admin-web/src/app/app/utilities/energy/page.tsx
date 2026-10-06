'use client';
import { useState } from 'react';
import { Zap, Plus, X, Flame } from 'lucide-react';

export default function EnergyDgPage() {
  const [runs, setRuns] = useState([
    { id: '1', dg: 'DG-SET-500KVA-01', date: '2026-04-12', hours: 3.5, diesel: 85, units: 620, costPerUnit: 24.5 },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ dg: 'DG-SET-500KVA-01', date: new Date().toISOString().slice(0, 10), hours: '', diesel: '', units: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setRuns((prev) => [
      {
        id: String(prev.length + 1),
        dg: form.dg,
        date: form.date,
        hours: parseFloat(form.hours) || 0,
        diesel: parseFloat(form.diesel) || 0,
        units: parseFloat(form.units) || 0,
        costPerUnit: 24.8,
      },
      ...prev,
    ]);
    setIsModalOpen(false);
    setForm({ dg: 'DG-SET-500KVA-01', date: new Date().toISOString().slice(0, 10), hours: '', diesel: '', units: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Energy & DG Backup Operations</h1>
          <p className="text-sm text-muted">Diesel generator logs, run hours, specific fuel consumption, and backup power tariffs.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Record DG Run
        </button>
      </div>

      <div className="border border-border rounded-lg bg-surface divide-y divide-border shadow-sm">
        {runs.map((r) => (
          <div key={r.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded">{r.dg}</span>
                <span>{r.units} kWh Generated</span>
              </div>
              <div className="text-xs text-muted flex gap-4 mt-1">
                <span>Date: {r.date}</span>
                <span>Run Duration: {r.hours} hrs</span>
                <span>Fuel: {r.diesel} L Diesel</span>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-surface-muted rounded">₹{r.costPerUnit}/unit</span>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Record DG Run Log</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">DG Set *</label>
                <input required type="text" value={form.dg} onChange={(e) => setForm({ ...form, dg: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Run Hours *</label>
                  <input required step="0.1" type="number" placeholder="3.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Diesel Consumed (L) *</label>
                  <input required type="number" placeholder="85" value={form.diesel} onChange={(e) => setForm({ ...form, diesel: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Units Generated (kWh)</label>
                <input required type="number" placeholder="620" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Save DG Run</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
