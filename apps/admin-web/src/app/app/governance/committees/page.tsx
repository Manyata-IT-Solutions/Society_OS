'use client';
import { useState } from 'react';
import { Users, Plus, X } from 'lucide-react';

export default function CommitteesPage() {
  const [committees, setCommittees] = useState([
    { id: '1', code: 'MC-2026', name: 'Grand Cedar Managing Committee', type: 'MANAGING', status: 'ACTIVE', term: '2026-2029', membersCount: 7 },
    { id: '2', code: 'EC-2026', name: 'Engineering & Maintenance Subcommittee', type: 'MAINTENANCE', status: 'ACTIVE', term: '2026-2029', membersCount: 4 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'MANAGING',
    term: '2026-2029',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) return;
    setCommittees((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        type: form.type,
        status: 'ACTIVE',
        term: form.term.trim(),
        membersCount: 1,
      },
    ]);
    setIsModalOpen(false);
    setForm({ code: '', name: '', type: 'MANAGING', term: '2026-2029' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Committees & Leadership Terms</h1>
          <p className="text-sm text-muted">Managing committees, subcommittees, leadership positions, and effective-dated tenures.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Create Committee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {committees.map((c) => (
          <div key={c.id} className="p-5 bg-surface border border-border rounded-lg space-y-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded">{c.code}</span>
                <h3 className="text-lg font-semibold text-foreground mt-1">{c.name}</h3>
              </div>
              <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-medium">{c.status}</span>
            </div>
            <div className="text-xs text-muted flex gap-4">
              <span>Type: <strong>{c.type}</strong></span>
              <span>Active Term: <strong>{c.term}</strong></span>
              <span>Members: <strong>{c.membersCount}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground">Create Society Committee</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Committee Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SC-2026"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Committee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sports & Cultural Subcommittee"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Committee Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="MANAGING">MANAGING</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="SECURITY">SECURITY</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="CULTURAL">CULTURAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Tenure / Term</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026-2029"
                    value={form.term}
                    onChange={(e) => setForm({ ...form, term: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
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
                  Create Committee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
