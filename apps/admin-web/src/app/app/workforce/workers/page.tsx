'use client';
import React, { useState } from 'react';
import { UserCheck, Shield, Award, Phone, Mail, Filter, Search, Plus, X } from 'lucide-react';

export default function WorkersPage() {
  const [workers, setWorkers] = useState([
    { id: '1', workerNumber: 'WRK-2026-000101', name: 'Rajesh Kumar', type: 'EMPLOYEE', role: 'Senior Electrician', dept: 'Engineering & Maintenance', status: 'ACTIVE', phone: '+919876543210', skills: ['HT Panel', 'DG Maintenance'] },
    { id: '2', workerNumber: 'WRK-2026-000102', name: 'Suresh Sharma', type: 'EMPLOYEE', role: 'Plumber & Pump Operator', dept: 'Engineering & Maintenance', status: 'ACTIVE', phone: '+919876543211', skills: ['Pump Repair', 'STP'] },
    { id: '3', workerNumber: 'WRK-2026-000201', name: 'Ramesh Singh', type: 'CONTRACT_WORKER', role: 'Security Guard', dept: 'Security Operations', vendor: 'Apex Security Services', status: 'ACTIVE', phone: '+919876543212', skills: ['CCTV', 'Gate Access'] },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'EMPLOYEE',
    role: '',
    dept: 'Engineering & Maintenance',
    phone: '',
    skills: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.role) return;
    setWorkers((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        workerNumber: `WRK-2026-000${prev.length + 101}`,
        name: form.name.trim(),
        type: form.type,
        role: form.role.trim(),
        dept: form.dept,
        status: 'ACTIVE',
        phone: form.phone.trim() || '+919800000000',
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      },
    ]);
    setIsModalOpen(false);
    setForm({ name: '', type: 'EMPLOYEE', role: '', dept: 'Engineering & Maintenance', phone: '', skills: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Worker Directory & Profiles</h1>
          <p className="text-sm text-muted">Unified operational master for direct employees and vendor contract workers.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Worker
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-surface-muted text-xs font-semibold uppercase text-muted">
            <tr>
              <th className="px-6 py-3">Worker / Number</th>
              <th className="px-6 py-3">Type & Engagement</th>
              <th className="px-6 py-3">Department & Role</th>
              <th className="px-6 py-3">Skills & Trades</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {workers.map((w) => (
              <tr key={w.id} className="hover:bg-surface-muted/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-foreground">{w.name}</div>
                  <div className="text-xs text-muted font-mono">{w.workerNumber}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${w.type === 'EMPLOYEE' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'}`}>
                    {w.type === 'EMPLOYEE' ? 'Direct Employee' : 'Vendor Contract'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{w.role}</div>
                  <div className="text-xs text-muted">{w.dept}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {w.skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-surface-muted text-xs rounded border border-border">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-muted">{w.phone}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-xs font-semibold rounded-full">{w.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground">Add Operational Worker</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Verma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="EMPLOYEE">Direct Employee</option>
                    <option value="CONTRACT_WORKER">Vendor Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Department</label>
                  <select
                    value={form.dept}
                    onChange={(e) => setForm({ ...form, dept: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Engineering & Maintenance">Engineering & Maintenance</option>
                    <option value="Security Operations">Security Operations</option>
                    <option value="Housekeeping & Horticulture">Housekeeping</option>
                    <option value="Facility Admin">Facility Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Operational Role / Designation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STP & Water Operator"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Skills & Certifications (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Pump Repair, Electrical Wiring, Fire Safety"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Save Worker Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
