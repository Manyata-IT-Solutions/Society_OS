'use client';
import { useState } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';

export default function HazardsRisksPage() {
  const [hazards, setHazards] = useState([
    { id: '1', title: 'Loose high-voltage cable in Transformer Room 2', risk: 'HIGH', status: 'UNDER_REVIEW' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', risk: 'MEDIUM' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setHazards((prev) => [
      ...prev,
      { id: String(prev.length + 1), title: form.title.trim(), risk: form.risk, status: 'OPEN' },
    ]);
    setIsModalOpen(false);
    setForm({ title: '', risk: 'MEDIUM' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Hazard Registry & Risk Mitigation</h1>
          <p className="text-sm text-muted">Proactive identification of environmental, structural, and electrical risks.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Report Hazard
        </button>
      </div>
      <div className="divide-y divide-border border border-border rounded-lg bg-surface shadow-sm">
        {hazards.map((h) => (
          <div key={h.id} className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-foreground text-sm">{h.title}</h3>
              <p className="text-xs text-muted">Status: {h.status}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${h.risk === 'HIGH' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>{h.risk} RISK</span>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Report Identified Hazard</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Hazard Description *</label>
                <input required placeholder="e.g. Slippery walkway near swimming pool" type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Risk Severity</label>
                <select value={form.risk} onChange={(e) => setForm({ ...form, risk: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2">
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Save Hazard</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
