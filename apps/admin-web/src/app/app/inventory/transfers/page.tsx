'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { ArrowLeftRight, Plus, CheckCircle2, X } from 'lucide-react';

export default function StockTransfersPage() {
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';
  const [transfers, setTransfers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    sourceStoreId: '',
    destinationStoreId: '',
    itemId: '',
    quantity: '5',
  });

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [trfRes, storeRes, itemRes] = await Promise.all([
        api.inventory.transfers.list({
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
      setTransfers(trfRes.data || []);
      setStores(storeRes || []);
      setItems(itemRes.data || []);
      if (storeRes && storeRes.length > 1) {
        setForm((f) => ({
          ...f,
          sourceStoreId: storeRes[0].id,
          destinationStoreId: storeRes[1].id,
        }));
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

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    const itm = items.find((i) => i.id === form.itemId);
    try {
      await api.inventory.transfers.create({
        organizationId: orgId,
        communityId: commId || null,
        sourceStoreId: form.sourceStoreId,
        destinationStoreId: form.destinationStoreId,
        lines: [
          {
            itemId: form.itemId,
            requestedQty: parseFloat(form.quantity) || 1,
            dispatchedQty: parseFloat(form.quantity) || 1,
            uomId: itm?.baseUomId,
          },
        ],
      });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to initiate transfer');
    }
  };

  const handleReceiveTransfer = async (id: string) => {
    try {
      await api.inventory.transfers.receive(id);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to receive transfer');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inter-Store Stock Transfers</h1>
          <p className="text-muted text-sm">
            Transfer materials between central warehouses, site stores, and technician vans.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Transfer Stock
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted border-b border-border text-xs uppercase text-muted font-semibold">
            <tr>
              <th className="px-4 py-3">Transfer No</th>
              <th className="px-4 py-3">Source Store</th>
              <th className="px-4 py-3">Destination Store</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Lines</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Loading transfers...
                </td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No stock transfers found.
                </td>
              </tr>
            ) : (
              transfers.map((t) => (
                <tr key={t.id} className="hover:bg-surface-muted/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-foreground">
                    {t.transferNumber}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {t.sourceStore?.name || t.sourceStoreId}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {t.destinationStore?.name || t.destinationStoreId}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        t.status === 'RECEIVED'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{t.lines?.length || 0}</td>
                  <td className="px-4 py-3 text-right">
                    {t.status === 'DISPATCHED' && (
                      <button
                        onClick={() => handleReceiveTransfer(t.id)}
                        className="text-xs text-primary hover:underline flex items-center gap-1 justify-end ml-auto"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Receive Stock
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-semibold">Dispatch Stock Transfer</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTransfer} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Source Store *</label>
                <select
                  required
                  value={form.sourceStoreId}
                  onChange={(e) => setForm({ ...form, sourceStoreId: e.target.value })}
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
                  Destination Store *
                </label>
                <select
                  required
                  value={form.destinationStoreId}
                  onChange={(e) => setForm({ ...form, destinationStoreId: e.target.value })}
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
                  Item to Transfer *
                </label>
                <select
                  required
                  value={form.itemId}
                  onChange={(e) => setForm({ ...form, itemId: e.target.value })}
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
                  Transfer Quantity *
                </label>
                <input
                  type="number"
                  required
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg"
                >
                  Dispatch Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
