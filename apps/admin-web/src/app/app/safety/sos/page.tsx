'use client';
import { useState } from 'react';
import { Siren, Plus, X, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function SafetySosDashboardPage() {
  const [alerts, setAlerts] = useState([
    { id: '1', type: 'MEDICAL_EMERGENCY', unit: 'Unit 402, Tower B', triggeredBy: 'Dr. Ramesh Gupta', at: '12-Apr-2026 18:45', status: 'ACKNOWLEDGED' },
  ]);
  const [isTriggerOpen, setIsTriggerOpen] = useState(false);
  const [unit, setUnit] = useState('Unit 101');
  const [type, setType] = useState('MEDICAL_EMERGENCY');

  const handleTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    setAlerts((prev) => [
      {
        id: String(prev.length + 1),
        type,
        unit,
        triggeredBy: 'Security Operations Test',
        at: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'DISPATCHED',
      },
      ...prev,
    ]);
    setIsTriggerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Emergency SOS Dispatch Console</h1>
          <p className="text-sm text-muted">Panic buttons, gate audio intercoms, lift emergency calls, and security response broadcast.</p>
        </div>
        <button onClick={() => setIsTriggerOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 shadow-sm">
          <AlertOctagon className="h-4 w-4" /> Trigger Test SOS
        </button>
      </div>

      <div className="border border-border rounded-lg bg-surface divide-y divide-border shadow-sm">
        {alerts.map((a) => (
          <div key={a.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-600 rounded">{a.type}</span>
                <span>{a.unit}</span>
              </div>
              <div className="text-xs text-muted flex gap-4 mt-1">
                <span>By: {a.triggeredBy}</span>
                <span>At: {a.at}</span>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-medium">{a.status}</span>
          </div>
        ))}
      </div>

      {isTriggerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Simulate Emergency SOS Dispatch</h2>
              <button onClick={() => setIsTriggerOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleTrigger} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Emergency Category</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2">
                  <option value="MEDICAL_EMERGENCY">Medical Emergency</option>
                  <option value="FIRE_ALARM">Fire Alarm Panic</option>
                  <option value="SECURITY_INTRUSION">Security Intrusion</option>
                  <option value="LIFT_ENTRAPMENT">Lift Entrapment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Origin Unit / Zone</label>
                <input required type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsTriggerOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-red-600 text-white px-4 py-2 hover:bg-red-700">Dispatch Emergency Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
