'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Sliders, Plus, CheckSquare, X, CheckCircle2 } from 'lucide-react';

export default function StockAdjustmentsAndCountsPage() {
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [counts, setCounts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);

  const [adjForm, setAdjForm] = useState({
    storeId: '',
    reason: 'COUNT_CORRECTION',
    notes: '',
    itemId: '',
    quantityDelta: '1',
  });

  const [countForm, setCountForm] = useState({
    storeId: '',
    countType: 'FULL',
    notes: '',
  });

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [adjRes, cntRes, storeRes, itemRes] = await Promise.all([
        api.inventory.adjustments.list({
          organizationId: orgId,
          communityId: commId,
        }),
        api.inventory.counts.list({
          organizationId: orgId,
          communityId: commId,
        }),
        api.inventory.stores.list({
          organizationId: orgId,
          communityId: commId,
        }),
        api.inventory.items.list({
          organizationId: orgId,
          communityId: commId,
        }),
      ]);
      setAdjustments(adjRes.data || []);
      setCounts(cntRes.data || []);
      setStores(storeRes || []);
      setItems(itemRes.data || []);
      if (storeRes && storeRes[0]) {
        setAdjForm((f) => ({ ...f, storeId: storeRes[0].id }));
        setCountForm((f) => ({ ...f, storeId: storeRes[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId, commId]);

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    const itm = items.find((i) => i.id === adjForm.itemId);
    try {
      await api.inventory.adjustments.create({
        organizationId: orgId,
        communityId: commId || null,
        storeId: adjForm.storeId,
        reason: adjForm.reason,
        notes: adjForm.notes || null,
        lines: [
          {
            itemId: adjForm.itemId,
            quantityDelta: parseFloat(adjForm.quantityDelta) || 0,
            uomId: itm?.baseUomId,
          },
        ],
      });
      setShowAdjModal(false);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to post adjustment');
    }
  };

  const handleStartCount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    try {
      await api.inventory.counts.create({
        organizationId: orgId,
        communityId: commId || null,
        storeId: countForm.storeId,
        countType: countForm.countType,
        notes: countForm.notes || null,
      });
      setShowCountModal(false);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to start physical count session');
    }
  };

  const handleReconcile = async (countId: string) => {
    try {
      await api.inventory.counts.reconcile(countId);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to reconcile count');
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Adjustments & Physical Counts</h1>
          <p className="text-muted text-sm">
            Compensating adjustments for damages, scrap, and physical cycle count reconciliation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdjModal(true)}
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-surface-muted flex items-center gap-2"
          >
            <Sliders className="h-4 w-4" /> Post Quick Adjustment
          </button>
          <button
            onClick={() => setShowCountModal(true)}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Start Physical Count
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold">Physical Count Sessions</h2>
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted border-b border-border text-xs uppercase text-muted font-semibold">
              <tr>
                <th className="px-4 py-3">Count Session</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Lines</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {counts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted">
                    No physical count sessions found.
                  </td>
                </tr>
              ) : (
                counts.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                      {c.countNumber}
                    </td>
                    <td className="px-4 py-3 font-medium">{c.store?.name || c.storeId}</td>
                    <td className="px-4 py-3 text-muted">{c.countType}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          c.status === 'POSTED'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : c.status === 'SUBMITTED'
                              ? 'bg-blue-500/10 text-blue-500'
                              : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{c.lines?.length || 0}</td>
                    <td className="px-4 py-3 text-right">
                      {c.status !== 'POSTED' && (
                        <button
                          onClick={() => handleReconcile(c.id)}
                          className="text-xs text-primary hover:underline flex items-center gap-1 justify-end ml-auto"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Reconcile Variance
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold">Recent Stock Adjustments</h2>
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted border-b border-border text-xs uppercase text-muted font-semibold">
              <tr>
                <th className="px-4 py-3">Adjustment No</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Lines</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted">
                    No manual adjustments recorded.
                  </td>
                </tr>
              ) : (
                adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                      {a.adjustmentNumber}
                    </td>
                    <td className="px-4 py-3">{a.store?.name || a.storeId}</td>
                    <td className="px-4 py-3 font-semibold text-muted">{a.reason}</td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{a.lines?.length || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-semibold">Post Quick Stock Adjustment</h3>
              <button
                onClick={() => setShowAdjModal(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Store *</label>
                <select
                  required
                  value={adjForm.storeId}
                  onChange={(e) => setAdjForm({ ...adjForm, storeId: e.target.value })}
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
                <label className="block text-xs font-medium text-muted mb-1">Reason *</label>
                <select
                  value={adjForm.reason}
                  onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="COUNT_CORRECTION">Physical Count Correction</option>
                  <option value="DAMAGE">Damaged / Broken in Storage</option>
                  <option value="EXPIRY_SCRAP">Expired / Scrapped</option>
                  <option value="THEFT_LOSS">Loss / Missing</option>
                  <option value="FOUND_STOCK">Found Stock / Unrecorded Inward</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Item *</label>
                <select
                  required
                  value={adjForm.itemId}
                  onChange={(e) => setAdjForm({ ...adjForm, itemId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
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
                <label className="block text-xs font-medium text-muted mb-1">
                  Quantity Delta (+ or -) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. -2 for damage, +5 for found stock"
                  value={adjForm.quantityDelta}
                  onChange={(e) => setAdjForm({ ...adjForm, quantityDelta: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAdjModal(false)}
                  className="px-4 py-2 text-sm border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg"
                >
                  Post Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-semibold">Start Physical Count Session</h3>
              <button
                onClick={() => setShowCountModal(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleStartCount} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Store to Audit *
                </label>
                <select
                  required
                  value={countForm.storeId}
                  onChange={(e) => setCountForm({ ...countForm, storeId: e.target.value })}
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
                <label className="block text-xs font-medium text-muted mb-1">Count Type</label>
                <select
                  value={countForm.countType}
                  onChange={(e) => setCountForm({ ...countForm, countType: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="FULL">Full Store Audit</option>
                  <option value="CYCLE">ABC Cycle Count</option>
                  <option value="SPOT_CHECK">Spot Check</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCountModal(false)}
                  className="px-4 py-2 text-sm border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg"
                >
                  Snapshot & Start
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
