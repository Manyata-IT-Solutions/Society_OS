'use client';
import React, { useState } from 'react';
import { ClipboardList, Plus, X } from 'lucide-react';

export default function WorkforceTasksPage() {
  const [checklists, setChecklists] = useState([
    { id: '1', title: 'Daily Morning STP Plant Inspection', dept: 'Engineering', itemsCount: 8, frequency: 'DAILY', status: 'ACTIVE' },
    { id: '2', title: 'Weekly Lift & Elevator Shaft Audit', dept: 'Maintenance', itemsCount: 14, frequency: 'WEEKLY', status: 'ACTIVE' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', dept: 'Engineering', frequency: 'DAILY' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setChecklists((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        title: form.title.trim(),
        dept: form.dept,
        itemsCount: 5,
        frequency: form.frequency,
        status: 'ACTIVE',
      },
    ]);
    setIsModalOpen(false);
    setForm({ title: '', dept: 'Engineering', frequency: 'DAILY' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Task Checklists & Routine Rounds</h1>
          <p className="text-sm text-muted">Daily SOP verification checklists, security patrolling routes, and equipment log rounds.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Create Task Checklist
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checklists.map((c) => (
          <div key={c.id} className="p-5 border border-border rounded-xl bg-surface space-y-2 shadow-sm">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-foreground text-base">{c.title}</h3>
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded font-semibold">{c.frequency}</span>
            </div>
            <div className="text-xs text-muted flex gap-4 pt-2 border-t border-border">
              <span>Department: <strong>{c.dept}</strong></span>
              <span>Check Items: <strong>{c.itemsCount}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">Create Task Checklist</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Checklist Title *</label>
                <input required placeholder="e.g. Daily Swimming Pool Water Chemistry Round" type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Department</label>
                  <select value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2">
                    <option value="Engineering">Engineering</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Security">Security</option>
                    <option value="Housekeeping">Housekeeping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Frequency</label>
                  <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2">
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border px-4 py-2 hover:bg-surface-muted">Cancel</button>
                <button type="submit" className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">Save Checklist</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
