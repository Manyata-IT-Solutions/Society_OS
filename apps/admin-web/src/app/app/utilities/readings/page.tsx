'use client';
import { useState } from 'react';
import { ClipboardList, Plus, X, CheckCircle2 } from 'lucide-react';

export default function MeterReadingsPage() {
  const [readings, setReadings] = useState([
    { id: '1', meter: 'MTR-ELEC-U101', date: '2026-03-31', value: 1475.0, uom: 'kWh', type: 'CLOSING', status: 'APPROVED', quality: 'GOOD' },
    { id: '2', meter: 'MTR-ELEC-U101', date: '2026-03-01', value: 1250.0, uom: 'kWh', type: 'OPENING', status: 'APPROVED', quality: 'GOOD' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    meter: 'MTR-ELEC-U101',
    value: '',
    uom: 'kWh',
    type: 'REGULAR',
    date: new Date().toISOString().slice(0, 10),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(form.value);
    if (isNaN(val)) return;
    setReadings((prev) => [
      {
        id: String(prev.length + 1),
        meter: form.meter,
        date: form.date,
        value: val,
        uom: form.uom,
        type: form.type,
        status: 'SUBMITTED',
        quality: 'GOOD',
      },
      ...prev,
    ]);
    setIsModalOpen(false);
    setForm({ meter: 'MTR-ELEC-U101', value: '', uom: 'kWh', type: 'REGULAR', date: new Date().toISOString().slice(0, 10) });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Meter Readings & Validation</h1>
          <p className="text-sm text-muted">Manual, mobile, and bulk readings with automated delta and rollover validation.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Record Reading
        </button>
      </div>

      <div className="border border-border rounded-lg bg-surface divide-y divide-border shadow-sm">
        {readings.map((r) => (
          <div key={r.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded">{r.meter}</span>
                <span className="font-semibold text-foreground text-sm">{r.value} {r.uom}</span>
              </div>
              <div className="text-xs text-muted flex gap-4 mt-1">
                <span>Date: {r.date}</span>
                <span>Type: {r.type}</span>
                <span>Quality: {r.quality}</span>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {r.status}
            </span>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Record Meter Reading</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Meter Identifier *</label>
                <input required type="text" value={form.meter} onChange={(e) => setForm({ ...form, meter: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Value *</label>
                  <input required step="any" type="number" placeholder="e.g. 1520.5" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Unit of Measure</label>
                  <input required type="text" value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Reading Date</label>
                <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Save Reading</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
