'use client';
import { useState } from 'react';
import { Siren, Plus, X, AlertTriangle } from 'lucide-react';

export default function SafetyIncidentsPage() {
  const [incidents, setIncidents] = useState([
    { id: '1', ref: 'INC-2026-00041', severity: 'HIGH', category: 'FIRE_ALARM', location: 'Tower B, Basement 1', reportedAt: '2026-04-10 14:20', status: 'INVESTIGATING' },
    { id: '2', ref: 'INC-2026-00040', severity: 'LOW', category: 'WATER_LEAK', location: 'Clubhouse Plant Room', reportedAt: '2026-04-08 09:15', status: 'RESOLVED' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ category: 'SAFETY_HAZARD', severity: 'MEDIUM', location: '', description: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.location) return;
    setIncidents((prev) => [
      {
        id: String(prev.length + 1),
        ref: `INC-2026-000${prev.length + 42}`,
        severity: form.severity,
        category: form.category,
        location: form.location.trim(),
        reportedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'OPEN',
      },
      ...prev,
    ]);
    setIsModalOpen(false);
    setForm({ category: 'SAFETY_HAZARD', severity: 'MEDIUM', location: '', description: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Incident Log & Investigation</h1>
          <p className="text-sm text-muted">Accidents, security breaches, near-misses, and corrective action plans (CAPA).</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Report Incident
        </button>
      </div>

      <div className="border border-border rounded-lg bg-surface divide-y divide-border shadow-sm">
        {incidents.map((i) => (
          <div key={i.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded">{i.ref}</span>
                <span className="font-semibold text-foreground text-sm">{i.category}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${i.severity === 'HIGH' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>{i.severity}</span>
              </div>
              <div className="text-xs text-muted flex gap-4 mt-1">
                <span>Location: {i.location}</span>
                <span>Reported: {i.reportedAt}</span>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 bg-surface-muted text-foreground rounded font-medium">{i.status}</span>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Report Incident or Near-Miss</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2">
                    <option value="SAFETY_HAZARD">Safety Hazard</option>
                    <option value="FIRE_ALARM">Fire / Smoke</option>
                    <option value="SECURITY_BREACH">Security Breach</option>
                    <option value="WATER_LEAK">Plumbing / Water Leak</option>
                    <option value="EQUIPMENT_FAULT">Equipment Failure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Severity</label>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High / Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Location *</label>
                <input required placeholder="e.g. Tower C, Floor 14 Lift Lobby" type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea rows={3} placeholder="Brief summary of what happened..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Submit Incident</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
