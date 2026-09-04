'use client';
import { useState } from 'react';
import { Gauge, Plus, X, Zap, Droplets } from 'lucide-react';

export default function MetersPage() {
  const [meters, setMeters] = useState([
    { id: '1', number: 'MTR-ELEC-MAIN-001', type: 'MAIN', service: 'Electricity', uom: 'kWh', status: 'ACTIVE', parent: 'Grid Substation' },
    { id: '2', number: 'MTR-ELEC-U101', type: 'SUB_METER', service: 'Electricity', uom: 'kWh', status: 'ACTIVE', parent: 'MTR-ELEC-MAIN-001', unit: 'Unit 101' },
    { id: '3', number: 'MTR-WATER-U101', type: 'SUB_METER', service: 'Water', uom: 'KL', status: 'ACTIVE', parent: 'MTR-WATER-MAIN-001', unit: 'Unit 101' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    number: '',
    type: 'SUB_METER',
    service: 'Electricity',
    uom: 'kWh',
    parent: 'MTR-ELEC-MAIN-001',
    unit: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.number) return;
    setMeters((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        number: form.number.trim().toUpperCase(),
        type: form.type,
        service: form.service,
        uom: form.uom,
        status: 'ACTIVE',
        parent: form.parent.trim(),
        unit: form.unit.trim() || undefined,
      },
    ]);
    setIsModalOpen(false);
    setForm({ number: '', type: 'SUB_METER', service: 'Electricity', uom: 'kWh', parent: 'MTR-ELEC-MAIN-001', unit: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Commercial & Sub-Meter Registry</h1>
          <p className="text-sm text-muted">Mains, sub-meters, virtual meters, unit assignments, and replacement lifecycles.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Register Meter
        </button>
      </div>

      <div className="border border-border rounded-lg bg-surface divide-y divide-border shadow-sm">
        {meters.map((m) => (
          <div key={m.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded font-mono">{m.number}</span>
                <span className="text-xs px-2 py-0.5 bg-surface-muted text-foreground rounded">{m.type}</span>
                <h4 className="font-semibold text-foreground text-sm">{m.service} ({m.uom})</h4>
              </div>
              <div className="text-xs text-muted flex gap-4 mt-1">
                <span>Parent: {m.parent}</span>
                {m.unit && <span>Assigned: {m.unit}</span>}
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-medium">{m.status}</span>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground">Register New Meter</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Meter Serial / Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MTR-ELEC-U102"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Utility Service</label>
                  <select
                    value={form.service}
                    onChange={(e) => {
                      const s = e.target.value;
                      setForm({ ...form, service: s, uom: s === 'Water' ? 'KL' : s === 'Gas' ? 'SCM' : 'kWh' });
                    }}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Electricity">Electricity</option>
                    <option value="Water">Water</option>
                    <option value="Gas">Gas / PNG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Unit of Measure (UOM)</label>
                  <input
                    type="text"
                    required
                    value={form.uom}
                    onChange={(e) => setForm({ ...form, uom: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                  </input>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Meter Category</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="SUB_METER">Sub-Meter</option>
                    <option value="MAIN">Main Incomer</option>
                    <option value="VIRTUAL">Virtual Meter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Assigned Unit (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 102"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Parent Feeder / Meter</label>
                <input
                  type="text"
                  placeholder="e.g. MTR-ELEC-MAIN-001"
                  value={form.parent}
                  onChange={(e) => setForm({ ...form, parent: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Register Meter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
