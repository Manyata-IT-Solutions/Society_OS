'use client';
import React, { useState } from 'react';
import { Award, Shield, Plus, X } from 'lucide-react';

export default function SkillsRegistryPage() {
  const [skills, setSkills] = useState([
    { id: '1', code: 'SKL-ELEC-HT', name: 'HT Panel Operation & Switching', category: 'ELECTRICAL', validityMonths: 24, workersCount: 4 },
    { id: '2', code: 'SKL-PLMB-STP', name: 'Sewage Treatment Plant Maintenance', category: 'PLUMBING', validityMonths: 12, workersCount: 2 },
    { id: '3', code: 'SKL-SEC-CCTV', name: 'CCTV Monitoring & VMS System', category: 'SECURITY', validityMonths: 36, workersCount: 6 },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', category: 'ELECTRICAL', validityMonths: '24' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) return;
    setSkills((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        category: form.category,
        validityMonths: parseInt(form.validityMonths) || 24,
        workersCount: 0,
      },
    ]);
    setIsModalOpen(false);
    setForm({ code: '', name: '', category: 'ELECTRICAL', validityMonths: '24' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Skills & Trade Licenses Catalog</h1>
          <p className="text-sm text-muted">Certification requirements, competency matrices, and mandatory license tracking.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Add Skill / License
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {skills.map((s) => (
          <div key={s.id} className="p-5 border border-border rounded-xl bg-surface space-y-2 shadow-sm">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded">{s.code}</span>
            <h3 className="font-semibold text-foreground text-sm">{s.name}</h3>
            <div className="text-xs text-muted flex justify-between pt-2 border-t border-border">
              <span>Category: <strong>{s.category}</strong></span>
              <span>Validity: <strong>{s.validityMonths}m</strong></span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Add Skill / Trade License</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Skill Code *</label>
                <input required placeholder="e.g. SKL-FIRE-SAFETY" type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Skill Name *</label>
                <input required placeholder="e.g. Fire Hydrant & Suppression Systems" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2">
                    <option value="ELECTRICAL">ELECTRICAL</option>
                    <option value="PLUMBING">PLUMBING</option>
                    <option value="SECURITY">SECURITY</option>
                    <option value="FIRE_SAFETY">FIRE_SAFETY</option>
                    <option value="HVAC">HVAC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Validity (Months)</label>
                  <input type="number" value={form.validityMonths} onChange={(e) => setForm({ ...form, validityMonths: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Add Skill</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
