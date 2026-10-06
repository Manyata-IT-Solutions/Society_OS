'use client';
import { useState } from 'react';
import { ShieldCheck, Plus, X } from 'lucide-react';

export default function SafetyCompliancePage() {
  const [items, setItems] = useState([
    { id: '1', title: 'Fire Safety NOC Renewal (Form B)', authority: 'State Fire Department', dueInDays: 45, status: 'IN_PROGRESS' },
    { id: '2', title: 'Pollution Control Board STP Consent to Operate (CTO)', authority: 'State PCB', dueInDays: 120, status: 'COMPLIANT' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', authority: '', dueInDays: '60' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setItems((prev) => [
      ...prev,
      { id: String(prev.length + 1), title: form.title.trim(), authority: form.authority.trim() || 'Municipal Authority', dueInDays: parseInt(form.dueInDays) || 60, status: 'IN_PROGRESS' },
    ]);
    setIsModalOpen(false);
    setForm({ title: '', authority: '', dueInDays: '60' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Statutory Safety & Compliance</h1>
          <p className="text-sm text-muted">Fire NOCs, lift licenses, DG approvals, and environmental consents.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Add Requirement
        </button>
      </div>
      <div className="divide-y divide-border border border-border rounded-lg bg-surface shadow-sm">
        {items.map((i) => (
          <div key={i.id} className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-foreground text-sm">{i.title}</h3>
              <p className="text-xs text-muted">{i.authority} • Due in {i.dueInDays} days</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded font-semibold">{i.status}</span>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Add Compliance Requirement</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Requirement Title *</label>
                <input required placeholder="e.g. Annual Lift Fitness Certificate" type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Issuing Authority</label>
                <input placeholder="e.g. Electrical Inspectorate" type="text" value={form.authority} onChange={(e) => setForm({ ...form, authority: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Due In (Days)</label>
                <input type="number" value={form.dueInDays} onChange={(e) => setForm({ ...form, dueInDays: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Save Requirement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
