'use client';
import { useState } from 'react';
import { AlertOctagon, Plus, X } from 'lucide-react';

export default function EvacuationPage() {
  const [plans, setPlans] = useState([
    { id: '1', zone: 'Tower A & Tower B', assemblyPoint: 'Central Sports Field Assembly Point 1', warden: 'Chief Security Officer', status: 'READY' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ zone: '', assemblyPoint: '', warden: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.zone) return;
    setPlans((prev) => [
      ...prev,
      { id: String(prev.length + 1), zone: form.zone.trim(), assemblyPoint: form.assemblyPoint.trim() || 'Central Lawn', warden: form.warden.trim() || 'Duty Officer', status: 'ACTIVE' },
    ]);
    setIsModalOpen(false);
    setForm({ zone: '', assemblyPoint: '', warden: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Evacuation Zones & Muster Points</h1>
          <p className="text-sm text-muted">Assembly area assignments, floor warden rosters, and building clearance tracking.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Add Evacuation Plan
        </button>
      </div>
      <div className="divide-y divide-border border border-border rounded-lg bg-surface shadow-sm">
        {plans.map((p) => (
          <div key={p.id} className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-foreground text-sm">{p.zone}</h3>
              <p className="text-xs text-muted">Assembly Point: {p.assemblyPoint} • Warden: {p.warden}</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-semibold">{p.status}</span>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Add Evacuation Zone Plan</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Zone / Tower Block *</label>
                <input required placeholder="e.g. Tower C & D" type="text" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Assembly Point</label>
                <input placeholder="e.g. North Gate Parking Assembly Area" type="text" value={form.assemblyPoint} onChange={(e) => setForm({ ...form, assemblyPoint: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Assigned Floor Warden</label>
                <input placeholder="e.g. Ramesh Chandra" type="text" value={form.warden} onChange={(e) => setForm({ ...form, warden: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
