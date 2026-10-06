'use client';
import { useState } from 'react';
import { FileBarChart, Plus, X, Download } from 'lucide-react';

export default function CustomReportsPage() {
  const [reports, setReports] = useState([
    { id: '1', title: 'Monthly Maintenance Recovery & Defaulters Matrix', type: 'FINANCIAL', lastRun: '2026-04-12', frequency: 'MONTHLY' },
    { id: '2', title: 'Preventive Maintenance SLA & Work Order Completion', type: 'OPERATIONAL', lastRun: '2026-04-11', frequency: 'WEEKLY' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'FINANCIAL', frequency: 'MONTHLY' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setReports((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        title: form.title.trim(),
        type: form.type,
        lastRun: 'Pending',
        frequency: form.frequency,
      },
    ]);
    setIsModalOpen(false);
    setForm({ title: '', type: 'FINANCIAL', frequency: 'MONTHLY' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Custom Query & Report Builder</h1>
          <p className="text-sm text-muted">Generate multi-dimensional operational, financial, and facility analytics reports.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Build Custom Report
        </button>
      </div>

      <div className="divide-y divide-border border border-border rounded-lg bg-surface shadow-sm">
        {reports.map((r) => (
          <div key={r.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">{r.type}</span>
                <span>{r.title}</span>
              </div>
              <div className="text-xs text-muted flex gap-4 mt-1">
                <span>Frequency: {r.frequency}</span>
                <span>Last Generated: {r.lastRun}</span>
              </div>
            </div>
            <button className="px-3 py-1.5 border border-border rounded text-xs font-semibold hover:bg-surface-muted flex items-center gap-1">
              <Download className="h-3 w-3" /> Export
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Build Custom Analytical Report</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Report Title *</label>
                <input required placeholder="e.g. Utility Sub-Meter Consumption Variance" type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Domain Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2">
                    <option value="FINANCIAL">FINANCIAL</option>
                    <option value="OPERATIONAL">OPERATIONAL</option>
                    <option value="FACILITY">FACILITY</option>
                    <option value="GOVERNANCE">GOVERNANCE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Frequency</label>
                  <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2">
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="ANNUAL">ANNUAL</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Save Report Query</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
