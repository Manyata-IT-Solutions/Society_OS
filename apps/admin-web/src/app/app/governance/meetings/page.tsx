'use client';
import { useState } from 'react';
import { Calendar, Plus, X, Video, MapPin } from 'lucide-react';

export default function GovernanceMeetingsPage() {
  const [meetings, setMeetings] = useState([
    {
      id: '1',
      number: 'AGM-2026-001',
      type: 'AGM',
      title: '2026 Annual General Body Meeting (AGM)',
      date: '2026-04-26',
      venue: 'Clubhouse Main Hall & Zoom Online',
      status: 'NOTICE_PUBLISHED',
      quorum: '25% Required',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'AGM',
    date: new Date().toISOString().slice(0, 10),
    venue: '',
    quorum: '25% Required',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.venue) return;
    setMeetings((prev) => [
      {
        id: String(prev.length + 1),
        number: `MTG-2026-00${prev.length + 1}`,
        title: form.title.trim(),
        type: form.type,
        date: form.date,
        venue: form.venue.trim(),
        status: 'SCHEDULED',
        quorum: form.quorum,
      },
      ...prev,
    ]);
    setIsModalOpen(false);
    setForm({ title: '', type: 'AGM', date: new Date().toISOString().slice(0, 10), venue: '', quorum: '25% Required' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Governance Meetings & AGM / EGM</h1>
          <p className="text-sm text-muted">Formal meetings, notice periods, live meeting mode, and quorum snapshots.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Schedule Meeting
        </button>
      </div>

      <div className="divide-y divide-border border border-border rounded-lg bg-surface shadow-sm">
        {meetings.map((m) => (
          <div key={m.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded">{m.number}</span>
                <span className="text-xs px-2 py-0.5 bg-surface-muted text-foreground rounded font-medium">{m.type}</span>
                <h3 className="font-semibold text-foreground text-sm">{m.title}</h3>
              </div>
              <div className="text-xs text-muted flex gap-4 mt-1">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {m.date}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {m.venue}</span>
                <span>Quorum: {m.quorum}</span>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-medium">{m.status}</span>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground">Schedule Governance Meeting</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Managing Committee Monthly Review"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Meeting Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="AGM">AGM</option>
                    <option value="EGM">EGM</option>
                    <option value="COMMITTEE">COMMITTEE</option>
                    <option value="SPECIAL">SPECIAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Venue / Online Link *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Society Clubhouse or Zoom Link"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Quorum Threshold</label>
                <input
                  type="text"
                  placeholder="e.g. 25% Required or 5 Members"
                  value={form.quorum}
                  onChange={(e) => setForm({ ...form, quorum: e.target.value })}
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
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
