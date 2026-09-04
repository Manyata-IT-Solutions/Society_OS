'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { ArrowUpFromLine, Plus, Search, RotateCcw, X, CheckCircle2 } from 'lucide-react';

export default function MaterialIssuesPage() {
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';
  const [issues, setIssues] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);

  const [form, setForm] = useState({
    storeId: '',
    workOrderId: '',
    notes: '',
    lines: [{ itemId: '', issuedQty: '1' }],
  });

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [issueRes, itemRes, storeRes] = await Promise.all([
        api.inventory.issues.list({
          organizationId: orgId,
          communityId: commId,
        }),
        api.inventory.items.list({
          organizationId: orgId,
          communityId: commId,
        }),
        api.inventory.stores.list({
          organizationId: orgId,
          communityId: commId,
        }),
      ]);
      setIssues(issueRes.data || []);
      setItems(itemRes.data || []);
      setStores(storeRes || []);
      if (storeRes && storeRes[0]) setForm((f) => ({ ...f, storeId: storeRes[0].id }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId, commId]);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    try {
      await api.inventory.issues.create({
        organizationId: orgId,
        communityId: commId || null,
        storeId: form.storeId,
        workOrderId: form.workOrderId || null,
        notes: form.notes || null,
        lines: form.lines.map((l) => {
          const itm = items.find((i) => i.id === l.itemId);
          return {
            itemId: l.itemId,
            requestedQty: parseFloat(l.issuedQty) || 1,
            issuedQty: parseFloat(l.issuedQty) || 1,
            uomId: itm?.baseUomId,
          };
        }),
      });
      setShowIssueModal(false);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to issue material');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Material Issues & Consumption</h1>
          <p className="text-muted text-sm">
            Issue materials to work orders and field technicians with automatic inventory
            deductions.
          </p>
        </div>
        <button
          onClick={() => setShowIssueModal(true)}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Issue Materials
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted border-b border-border text-xs uppercase text-muted font-semibold">
            <tr>
              <th className="px-4 py-3">Issue No</th>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Type / Work Order</th>
              <th className="px-4 py-3">Issued Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Items</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Loading material issues...
                </td>
              </tr>
            ) : issues.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No material issues recorded yet.
                </td>
              </tr>
            ) : (
              issues.map((i) => (
                <tr key={i.id} className="hover:bg-surface-muted/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-foreground">{i.issueNumber}</td>
                  <td className="px-4 py-3">{i.store?.name || i.storeId}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{i.issueType}</span>
                    {i.workOrderId && (
                      <span className="block text-xs font-mono text-muted">
                        WO: {i.workOrderId.slice(0, 8)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">
                    {new Date(i.issuedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                      {i.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{i.lines?.length || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-semibold">Issue Materials from Store</h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Source Store *</label>
                <select
                  required
                  value={form.storeId}
                  onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Work Order ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Paste Work Order UUID or leave empty for ad-hoc issue"
                  value={form.workOrderId}
                  onChange={(e) => setForm({ ...form, workOrderId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted">Item & Quantity</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <select
                      required
                      value={form.lines[0]?.itemId}
                      onChange={(e) => {
                        const newLines = [...form.lines];
                        newLines[0]!.itemId = e.target.value;
                        setForm({ ...form, lines: newLines });
                      }}
                      className="w-full px-2 py-2 bg-background border border-border rounded-lg text-sm"
                    >
                      <option value="">Select Item</option>
                      {items.map((itm) => (
                        <option key={itm.id} value={itm.id}>
                          {itm.name} ({itm.itemCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      required
                      placeholder="Qty"
                      value={form.lines[0]?.issuedQty}
                      onChange={(e) => {
                        const newLines = [...form.lines];
                        newLines[0]!.issuedQty = e.target.value;
                        setForm({ ...form, lines: newLines });
                      }}
                      className="w-full px-2 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-sm border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg"
                >
                  Issue Materials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
