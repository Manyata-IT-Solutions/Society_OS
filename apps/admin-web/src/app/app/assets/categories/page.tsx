'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  ArrowLeft,
  Plus,
  Search,
  Layers,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';

export default function AssetCategoriesPage() {
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    defaultCriticality: 'MEDIUM',
    defaultExpectedLifeYears: '10',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.assetCategories.list({
        organizationId: orgId,
        communityId: commId,
        search: search || undefined,
      });
      setCategories(res || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.assetCategories.create({
        organizationId: orgId,
        communityId: commId,
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description || undefined,
        defaultCriticality: formData.defaultCriticality,
        defaultExpectedLifeYears: Number(formData.defaultExpectedLifeYears) || undefined,
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        code: '',
        description: '',
        defaultCriticality: 'MEDIUM',
        defaultExpectedLifeYears: '10',
      });
      await loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center space-x-4">
          <Link
            href="/app/assets"
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FolderTree className="h-6 w-6 text-primary" />
              Asset Category Taxonomy
            </h1>
            <p className="text-sm text-muted-foreground">
              Define physical asset classes, default life spans, and criticality profiles.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            <p>Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-foreground bg-card border border-border rounded-xl">
            <FolderTree className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-semibold text-foreground">No Asset Categories Found</p>
          </div>
        ) : (
          categories.map((c) => (
            <div
              key={c.id}
              className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {c.code}
                </span>
                <span className="text-xs text-muted-foreground">
                  Expected Life:{' '}
                  <strong>
                    {c.defaultExpectedLifeYears ? `${c.defaultExpectedLifeYears}y` : 'N/A'}
                  </strong>
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-foreground">{c.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {c.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Criticality: <strong>{c.defaultCriticality}</strong>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">ACTIVE</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Add Asset Category</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Category Code (e.g. HVAC)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ELEC, HVAC, PLUMB..."
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Electrical & Power Systems"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Transformers, DG sets, panels..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Default Criticality
                  </label>
                  <select
                    value={formData.defaultCriticality}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultCriticality: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Default Life (Years)
                  </label>
                  <input
                    type="number"
                    value={formData.defaultExpectedLifeYears}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultExpectedLifeYears: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border text-sm font-medium rounded-lg text-foreground bg-card hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90"
                >
                  {submitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
