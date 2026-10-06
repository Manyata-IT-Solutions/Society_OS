'use client';
import { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';

export default function UtilityTariffsPage() {
  const [tariffs, setTariffs] = useState([
    { id: '1', name: 'Residential Grid Electricity Surcharge Tier', utility: 'Electricity', ratePerUOM: 8.5, uom: 'kWh', status: 'ACTIVE' },
    { id: '2', name: 'DG Backup Power Recovery Tariff', utility: 'DG Power', ratePerUOM: 25.0, uom: 'kWh', status: 'ACTIVE' },
    { id: '3', name: 'Water Usage Domestic Sub-Meter Tariff', utility: 'Water', ratePerUOM: 45.0, uom: 'KL', status: 'ACTIVE' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', utility: 'Electricity', ratePerUOM: '9.0', uom: 'kWh' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setTariffs((prev) => [
      ...prev,
      { id: String(prev.length + 1), name: form.name.trim(), utility: form.utility, ratePerUOM: parseFloat(form.ratePerUOM) || 9.0, uom: form.uom, status: 'ACTIVE' },
    ]);
    setIsModalOpen(false);
    setForm({ name: '', utility: 'Electricity', ratePerUOM: '9.0', uom: 'kWh' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Utility Tariff Plans & Rates</h1>
          <p className="text-sm text-muted">Fixed rates, tiered slabs, DG generator fuel surcharges, and peak-hour tariffs.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Create Tariff Plan
        </button>
      </div>
      <div className="divide-y divide-border border border-border rounded-lg bg-surface shadow-sm">
        {tariffs.map((t) => (
          <div key={t.id} className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-foreground text-sm">{t.name}</h3>
              <p className="text-xs text-muted">Service: {t.utility} • Rate: ₹{t.ratePerUOM} per {t.uom}</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-semibold">{t.status}</span>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Create Tariff Plan</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Tariff Plan Name *</label>
                <input required placeholder="e.g. Commercial Meter High Slab" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Utility Service</label>
                  <select value={form.utility} onChange={(e) => setForm({ ...form, utility: e.target.value, uom: e.target.value === 'Water' ? 'KL' : 'kWh' })} className="w-full rounded-md border border-border bg-background px-3 py-2">
                    <option value="Electricity">Electricity</option>
                    <option value="DG Power">DG Power</option>
                    <option value="Water">Water</option>
                    <option value="Gas">Gas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Rate per Unit (₹)</label>
                  <input type="number" step="0.1" value={form.ratePerUOM} onChange={(e) => setForm({ ...form, ratePerUOM: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Save Tariff Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
