'use client';
import { useState } from 'react';
import { Award, Plus, X } from 'lucide-react';

export default function SafetyCredentialsPage() {
  const [creds, setCreds] = useState([
    { id: '1', name: 'HT Electrical Supervisory License (Class A)', holder: 'Rajesh Kumar', exp: '2027-03-31', status: 'VALID' },
    { id: '2', name: 'First Aid & CPR Certified Responder', holder: 'Sunil Verma', exp: '2026-11-15', status: 'VALID' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', holder: '', exp: '2027-12-31' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.holder) return;
    setCreds((prev) => [
      ...prev,
      { id: String(prev.length + 1), name: form.name.trim(), holder: form.holder.trim(), exp: form.exp, status: 'VALID' },
    ]);
    setIsModalOpen(false);
    setForm({ name: '', holder: '', exp: '2027-12-31' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Safety Credentials & Licenses</h1>
          <p className="text-sm text-muted">Technician certifications, electrical supervisor permits, and first responder credentials.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Register Credential
        </button>
      </div>
      <div className="divide-y divide-border border border-border rounded-lg bg-surface shadow-sm">
        {creds.map((c) => (
          <div key={c.id} className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-foreground text-sm">{c.name}</h3>
              <p className="text-xs text-muted">Holder: {c.holder} • Expires: {c.exp}</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-semibold">{c.status}</span>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Register Safety Credential</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Credential / License Name *</label>
                <input required placeholder="e.g. DG Operator Certificate" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Holder Name *</label>
                <input required placeholder="e.g. Ramesh Kumar" type="text" value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Expiry Date</label>
                <input type="date" value={form.exp} onChange={(e) => setForm({ ...form, exp: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Save Credential</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
