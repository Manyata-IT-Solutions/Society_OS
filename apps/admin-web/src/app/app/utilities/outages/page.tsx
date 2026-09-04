'use client';
import { useState } from 'react';
import { AlertCircle, Plus, X } from 'lucide-react';

export default function UtilityOutagesPage() {
  const [outages, setOutages] = useState([
    { id: '1', utility: 'ELECTRICITY', area: 'Tower A & B', start: '2026-04-14 10:00', estEnd: '2026-04-14 13:00', reason: 'HT Panel Transformer Preventive Maintenance', status: 'SCHEDULED' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ utility: 'ELECTRICITY', area: '', start: '2026-04-15 10:00', estEnd: '2026-04-15 12:00', reason: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.area || !form.reason) return;
    setOutages((prev) => [
      ...prev,
      { id: String(prev.length + 1), utility: form.utility, area: form.area.trim(), start: form.start, estEnd: form.estEnd, reason: form.reason.trim(), status: 'SCHEDULED' },
    ]);
    setIsModalOpen(false);
    setForm({ utility: 'ELECTRICITY', area: '', start: '2026-04-15 10:00', estEnd: '2026-04-15 12:00', reason: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Utility Outages & Planned Shutdowns</h1>
          <p className="text-sm text-muted">Announce scheduled power shutdowns, water supply interruptions, and emergency outages.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Report Outage
        </button>
      </div>
      <div className="divide-y divide-border border border-border rounded-lg bg-surface shadow-sm">
        {outages.map((o) => (
          <div key={o.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded">{o.utility}</span>
                <span>{o.area}</span>
              </div>
              <p className="text-xs text-muted mt-1">{o.reason} • {o.start} to {o.estEnd}</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded font-semibold">{o.status}</span>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Schedule Utility Outage</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Utility Service</label>
                  <select value={form.utility} onChange={(e) => setForm({ ...form, utility: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2">
                    <option value="ELECTRICITY">ELECTRICITY</option>
                    <option value="WATER">WATER</option>
                    <option value="GAS">GAS</option>
                    <option value="INTERNET">INTERNET / FIBER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Affected Area *</label>
                  <input required placeholder="e.g. Tower C & D" type="text" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Shutdown Start</label>
                <input type="text" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Reason / Work Details *</label>
                <textarea rows={2} required placeholder="e.g. Overhead water tank annual desilting" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Publish Outage</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
