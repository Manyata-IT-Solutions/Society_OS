'use client';
import { useState } from 'react';
import { ClipboardCheck, Plus, X } from 'lucide-react';

export default function SafetyInspectionsPage() {
  const [inspections, setInspections] = useState([
    { id: '1', area: 'Main Substation & HT Panels', auditor: 'Tata Power Engineering Auditor', date: '2026-04-18', status: 'SCHEDULED' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ area: '', auditor: '', date: '2026-04-20' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.area) return;
    setInspections((prev) => [
      ...prev,
      { id: String(prev.length + 1), area: form.area.trim(), auditor: form.auditor.trim() || 'Internal Safety Team', date: form.date, status: 'SCHEDULED' },
    ]);
    setIsModalOpen(false);
    setForm({ area: '', auditor: '', date: '2026-04-20' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Safety Audits & Periodic Inspections</h1>
          <p className="text-sm text-muted">Mandatory structural, electrical, and life-safety audits across society blocks.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Schedule Inspection
        </button>
      </div>
      <div className="divide-y divide-border border border-border rounded-lg bg-surface shadow-sm">
        {inspections.map((i) => (
          <div key={i.id} className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-foreground text-sm">{i.area}</h3>
              <p className="text-xs text-muted">Auditor: {i.auditor} • Date: {i.date}</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded font-semibold">{i.status}</span>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Schedule Safety Inspection</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Inspection Zone / Area *</label>
                <input required placeholder="e.g. Clubhouse Fire Exit Stairwells" type="text" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Assigned Inspector / Agency</label>
                <input placeholder="e.g. Bureau Veritas Safety Auditor" type="text" value={form.auditor} onChange={(e) => setForm({ ...form, auditor: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Audit Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Schedule Inspection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
