'use client';
import { useState } from 'react';
import { Droplets, Plus, X } from 'lucide-react';

export default function WaterTankerPage() {
  const [tankers, setTankers] = useState([
    { id: '1', vendor: 'Cauvery Water Suppliers', capacityKL: 12, cost: 1800, date: '2026-04-12', challan: 'CH-9941', status: 'RECEIVED' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ vendor: '', capacityKL: '12', cost: '1800', challan: '', date: new Date().toISOString().slice(0, 10) });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendor || !form.challan) return;
    setTankers((prev) => [
      {
        id: String(prev.length + 1),
        vendor: form.vendor.trim(),
        capacityKL: parseFloat(form.capacityKL) || 12,
        cost: parseFloat(form.cost) || 1800,
        challan: form.challan.trim(),
        date: form.date,
        status: 'RECEIVED',
      },
      ...prev,
    ]);
    setIsModalOpen(false);
    setForm({ vendor: '', capacityKL: '12', cost: '1800', challan: '', date: new Date().toISOString().slice(0, 10) });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Water & Tanker Reconciliation</h1>
          <p className="text-sm text-muted">Tanker deliveries, STP output, borewell meters, and municipal supply balancing.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Record Tanker
        </button>
      </div>

      <div className="border border-border rounded-lg bg-surface divide-y divide-border shadow-sm">
        {tankers.map((t) => (
          <div key={t.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded">{t.challan}</span>
                <span>{t.vendor}</span>
              </div>
              <div className="text-xs text-muted flex gap-4 mt-1">
                <span>Date: {t.date}</span>
                <span>Volume: {t.capacityKL} KL</span>
                <span>Cost: ₹{t.cost}</span>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-medium">{t.status}</span>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Record Water Tanker Receipt</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Supplier / Vendor *</label>
                <input required placeholder="e.g. Kaveri Water Supplies" type="text" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Challan / Bill No *</label>
                  <input required placeholder="CH-1002" type="text" value={form.challan} onChange={(e) => setForm({ ...form, challan: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Capacity (KL)</label>
                  <input required type="number" value={form.capacityKL} onChange={(e) => setForm({ ...form, capacityKL: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Cost (INR)</label>
                  <input required type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Receipt Date</label>
                  <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Save Tanker Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
