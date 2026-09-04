'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Folder,
  Layers,
  CheckCircle2,
  Shield,
  Clock,
} from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [slaPolicies, setSlaPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [defaultPriority, setDefaultPriority] = useState('NORMAL');
  const [defaultTeamId, setDefaultTeamId] = useState('');
  const [defaultSlaPolicyId, setDefaultSlaPolicyId] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);
  const [requiresUnit, setRequiresUnit] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [catTree, teamList, slaList] = await Promise.all([
        api.helpdesk.getCategoryTree(),
        api.helpdesk.listTeams(),
        api.sla.listPolicies(),
      ]);
      setCategories(catTree || []);
      setTeams(teamList.items || []);
      setSlaPolicies(slaList.items || []);
    } catch (err: any) {
      setFeedback(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = (parentCat?: any) => {
    setEditingCategory(null);
    setName('');
    setKey('');
    setDescription('');
    setParentId(parentCat ? parentCat.id : '');
    setDefaultPriority('NORMAL');
    setDefaultTeamId('');
    setDefaultSlaPolicyId('');
    setIsSensitive(false);
    setRequiresUnit(true);
    setShowModal(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name);
    setKey(cat.key);
    setDescription(cat.description || '');
    setParentId(cat.parentId || '');
    setDefaultPriority(cat.defaultPriority || 'NORMAL');
    setDefaultTeamId(cat.defaultTeamId || '');
    setDefaultSlaPolicyId(cat.defaultSlaPolicyId || '');
    setIsSensitive(cat.isSensitive || false);
    setRequiresUnit(cat.requiresUnit ?? true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.helpdesk.updateCategory(editingCategory.id, {
          name,
          description: description || undefined,
          defaultPriority,
          defaultTeamId: defaultTeamId || null,
          defaultSlaPolicyId: defaultSlaPolicyId || null,
          isSensitive,
          requiresUnit,
        });
        setFeedback('Category updated successfully.');
      } else {
        await api.helpdesk.createCategory({
          name,
          key: key.trim().toLowerCase().replace(/\s+/g, '.'),
          description: description || undefined,
          parentId: parentId || undefined,
          defaultPriority,
          defaultTeamId: defaultTeamId || undefined,
          defaultSlaPolicyId: defaultSlaPolicyId || undefined,
          isSensitive,
          requiresUnit,
        });
        setFeedback('Category created successfully.');
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setFeedback(`Operation failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this category?')) return;
    try {
      await api.helpdesk.deleteCategory(id);
      await loadData();
      setFeedback('Category deactivated.');
    } catch (err: any) {
      setFeedback(`Deactivate failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Helpdesk Category Catalog</h1>
          <p className="text-sm text-muted">
            2-tier hierarchical category tree with SLA mapping, priority defaults and team routing
            rules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => handleOpenCreate()}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-md bg-primary/10 border border-primary/20 p-3 text-xs text-primary font-medium">
          {feedback}
        </div>
      )}

      {/* Category Tree Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
            Loading category catalog...
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
            No categories defined yet. Create your first category above.
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden"
            >
              {/* Parent Category Row */}
              <div className="flex items-center justify-between border-b border-border bg-surface-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>{cat.name}</span>
                      <span className="text-xs text-muted font-mono">({cat.key})</span>
                      {cat.isSensitive && (
                        <span className="rounded bg-rose-500/10 text-rose-500 px-1.5 py-0.5 text-[10px] font-semibold">
                          Confidential
                        </span>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-muted mt-0.5">{cat.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded border border-border px-2 py-0.5 text-[10px] font-medium">
                    Priority: {cat.defaultPriority || 'NORMAL'}
                  </span>
                  <button
                    onClick={() => handleOpenCreate(cat)}
                    className="rounded border border-border px-2.5 py-1 text-xs font-medium hover:bg-surface-muted transition"
                  >
                    + Subcategory
                  </button>
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="rounded border border-border p-1.5 text-muted hover:text-foreground transition"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="rounded border border-border p-1.5 text-rose-500 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Subcategories List */}
              {cat.subcategories && cat.subcategories.length > 0 && (
                <div className="divide-y divide-border bg-surface px-4 py-2">
                  {cat.subcategories.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between py-2.5 pl-6 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted">↳</span>
                        <span className="font-semibold text-foreground">{sub.name}</span>
                        <span className="text-muted font-mono text-[11px]">({sub.key})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted">
                          Priority: {sub.defaultPriority || 'NORMAL'}
                        </span>
                        <button
                          onClick={() => handleOpenEdit(sub)}
                          className="text-muted hover:text-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="text-rose-500 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: Create / Edit Category */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-lg space-y-4"
          >
            <h3 className="text-lg font-bold">
              {editingCategory ? 'Edit Category' : parentId ? 'Add Subcategory' : 'Create Category'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-muted">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Electrical & Lighting"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                  required
                />
              </div>

              {!editingCategory && (
                <div>
                  <label className="text-xs font-semibold text-muted">Unique Key</label>
                  <input
                    type="text"
                    placeholder="e.g. category.electrical"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-muted">Default Priority</label>
                <select
                  value={defaultPriority}
                  onChange={(e) => setDefaultPriority(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">Default Operational Team</label>
                <select
                  value={defaultTeamId}
                  onChange={(e) => setDefaultTeamId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                >
                  <option value="">-- None --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted">Default SLA Policy</label>
                <select
                  value={defaultSlaPolicyId}
                  onChange={(e) => setDefaultSlaPolicyId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                >
                  <option value="">-- None --</option>
                  {slaPolicies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.durationMinutes}m)
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-muted">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details on issues covered by this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-6 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSensitive}
                    onChange={(e) => setIsSensitive(e.target.checked)}
                  />
                  <span>Confidential / Sensitive Category</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresUnit}
                    onChange={(e) => setRequiresUnit(e.target.checked)}
                  />
                  <span>Requires Unit Selection</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
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
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
