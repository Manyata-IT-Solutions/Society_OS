'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  UserCheck,
  ShieldCheck,
  Phone,
  Mail,
} from 'lucide-react';

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.helpdesk.listTeams();
      setTeams(res.items || []);
    } catch (err: any) {
      setFeedback(`Error loading teams: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setName('');
    setCode('');
    setDescription('');
    setEmail('');
    setPhone('');
    setShowModal(true);
  };

  const handleOpenEdit = (team: any) => {
    setEditingTeam(team);
    setName(team.name);
    setCode(team.code);
    setDescription(team.description || '');
    setEmail(team.email || '');
    setPhone(team.phone || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        await api.helpdesk.updateTeam(editingTeam.id, {
          name,
          description: description || undefined,
          email: email || undefined,
          phone: phone || undefined,
        });
        setFeedback('Team updated.');
      } else {
        await api.helpdesk.createTeam({
          name,
          code: code.trim().toUpperCase(),
          description: description || undefined,
          email: email || undefined,
          phone: phone || undefined,
        });
        setFeedback('Team created.');
      }
      setShowModal(false);
      await loadTeams();
    } catch (err: any) {
      setFeedback(`Operation failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Helpdesk Operational Teams</h1>
          <p className="text-sm text-muted">
            Manage field maintenance teams, facility support desks, technician rosters, and
            auto-dispatch queues.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadTeams}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Team</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-md bg-primary/10 border border-primary/20 p-3 text-xs text-primary font-medium">
          {feedback}
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-xl border border-border bg-surface p-8 text-center text-muted">
            Loading operational teams...
          </div>
        ) : teams.length === 0 ? (
          <div className="col-span-full rounded-xl border border-border bg-surface p-8 text-center text-muted">
            No operational teams found. Create your first operational team above.
          </div>
        ) : (
          teams.map((team) => (
            <div
              key={team.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-500/10 p-2.5 text-indigo-500">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{team.name}</h3>
                    <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
                      {team.code}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenEdit(team)}
                  className="rounded border border-border p-1.5 text-muted hover:text-foreground transition"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {team.description && (
                <p className="text-xs text-muted line-clamp-2">{team.description}</p>
              )}

              <div className="border-t border-border pt-3 space-y-1.5 text-xs text-muted">
                {team.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{team.email}</span>
                  </div>
                )}
                {team.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{team.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span>Members: {team.members?.length ?? 0}</span>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-500 px-2 py-0.5 text-[10px] font-semibold">
                    Active
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create / Edit Team */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg space-y-4"
          >
            <h3 className="text-lg font-bold">
              {editingTeam ? 'Edit Operational Team' : 'Create Operational Team'}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-semibold text-muted">Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Electrical Maintenance Team"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                  required
                />
              </div>

              {!editingTeam && (
                <div>
                  <label className="text-xs font-semibold text-muted">Team Code</label>
                  <input
                    type="text"
                    placeholder="e.g. ELEC-TEAM"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-muted">Team Email (Optional)</label>
                <input
                  type="email"
                  placeholder="electrical@society.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">
                  Team Hotline Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+1-555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">Description</label>
                <textarea
                  rows={2}
                  placeholder="Coverage scope, shifts, technician roles..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Save Team
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
