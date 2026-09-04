'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Ticket, ArrowLeft, Send, AlertCircle } from 'lucide-react';

export default function NewComplaintPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [communityId, setCommunityId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationType, setLocationType] = useState('UNIT');
  const [priority, setPriority] = useState('NORMAL');

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const cats = await api.helpdesk.getCategoryTree();
      setCategories(cats || []);
    } catch (err: any) {
      setError(`Failed to load form metadata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !categoryId) {
      setError('Please fill in category, title and description.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.residentComplaints.create({
        communityId: communityId || '00000000-0000-0000-0000-000000000000',
        categoryId,
        subcategoryId: subcategoryId || undefined,
        title: title.trim(),
        description: description.trim(),
        locationType,
        priority,
      });
      router.push(`/app/resident/complaints/${res.id}`);
    } catch (err: any) {
      setError(`Submission failed: ${err.message}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/app/resident/complaints"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to My Complaints</span>
      </Link>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl font-bold">File a Service Request / Complaint</h1>
          <p className="text-xs text-muted">
            Submit an issue to facility operations. You will receive real-time notifications as
            technicians respond.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-500 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {communities.length > 1 && (
            <div>
              <label className="text-xs font-semibold text-muted">Community</label>
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
              >
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId('');
                }}
                className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                required
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategoryObj?.subcategories?.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-muted">Subcategory</label>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                >
                  <option value="">-- Select Subcategory --</option>
                  {selectedCategoryObj.subcategories.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted">Location</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
              >
                <option value="UNIT">My Unit</option>
                <option value="BUILDING">Building Common Area</option>
                <option value="COMMUNITY">Community / Grounds</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High (Urgent Attention)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted">Issue Summary / Title *</label>
            <input
              type="text"
              placeholder="e.g. Water leaking under bathroom sink"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted">Detailed Description *</label>
            <textarea
              rows={4}
              placeholder="Please provide details, when it started, and any immediate hazard..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Link
              href="/app/resident/complaints"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Complaint'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
