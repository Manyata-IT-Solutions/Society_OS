'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { ArrowDownToLine, Plus, Search, RotateCcw, X, CheckCircle2 } from 'lucide-react';

export default function GoodsReceiptsPage() {
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';
  const [receipts, setReceipts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReceiptForReverse, setSelectedReceiptForReverse] = useState<any>(null);
  const [reversalReason, setReversalReason] = useState('');

  const [form, setForm] = useState({
    storeId: '',
    supplierName: '',
    sourceReference: '',
    notes: '',
    lines: [
      {
        itemId: '',
        quantity: '10',
        uomId: '',
        unitPrice: '150',
        batchNumber: '',
        serialNumbers: '',
      },
    ],
  });

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [recRes, itemRes, storeRes, uomRes] = await Promise.all([
        api.inventory.receipts.list({
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
        api.inventory.uoms.list(orgId),
      ]);
      setReceipts(recRes.data || []);
      setItems(itemRes.data || []);
      setStores(storeRes || []);
      setUoms(uomRes || []);
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

  const handleAddLine = () => {
    setForm({
      ...form,
      lines: [
        ...form.lines,
        {
          itemId: '',
          quantity: '1',
          uomId: '',
          unitPrice: '0',
          batchNumber: '',
          serialNumbers: '',
        },
      ],
    });
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    try {
      await api.inventory.receipts.create({
        organizationId: orgId,
        communityId: commId || null,
        storeId: form.storeId,
        supplierName: form.supplierName || null,
        sourceReference: form.sourceReference || null,
        notes: form.notes || null,
        lines: form.lines.map((l) => ({
          itemId: l.itemId,
          quantity: parseFloat(l.quantity) || 0,
          uomId: l.uomId || uoms[0]?.id,
          unitPrice: parseFloat(l.unitPrice) || 0,
          batchNumber: l.batchNumber || null,
          serialNumbers: l.serialNumbers
            ? l.serialNumbers
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        })),
      });
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to post receipt');
    }
  };

  const handleReverseReceipt = async () => {
    if (!selectedReceiptForReverse || !reversalReason) return;
    try {
      await api.inventory.receipts.reverse(selectedReceiptForReverse.id, {
        reason: reversalReason,
      });
      setSelectedReceiptForReverse(null);
      setReversalReason('');
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to reverse receipt');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goods Receipts (Inward Stock)</h1>
          <p className="text-muted text-sm">
            Receive spare parts and materials into warehouse locations with batch and serial
            logging.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Inward Goods Receipt
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted border-b border-border text-xs uppercase text-muted font-semibold">
            <tr>
              <th className="px-4 py-3">Receipt No</th>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Supplier / Ref</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Lines</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Loading goods receipts...
                </td>
              </tr>
            ) : receipts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No inward receipts recorded yet. Click &quot;Inward Goods Receipt&quot; to add
                  stock.
                </td>
              </tr>
            ) : (
              receipts.map((r) => (
                <tr key={r.id} className="hover:bg-surface-muted/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-foreground">
                    {r.receiptNumber}
                  </td>
                  <td className="px-4 py-3">{r.store?.name || r.storeId}</td>
                  <td className="px-4 py-3 text-muted">
                    <div>{r.supplierName || 'Manual Delivery'}</div>
                    <div className="font-mono text-xs">{r.sourceReference || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">
                    {new Date(r.receivedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        r.status === 'POSTED'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{r.lines?.length || 0}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'POSTED' && (
                      <button
                        onClick={() => setSelectedReceiptForReverse(r)}
                        className="text-xs text-red-500 hover:underline flex items-center gap-1 justify-end ml-auto"
                      >
                        <RotateCcw className="h-3 w-3" /> Reverse
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-semibold">Inward Goods Receipt</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateReceipt} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Destination Store *
                  </label>
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
                  <label className="block text-xs font-medium text-muted mb-1">Supplier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Havells India Ltd"
                    value={form.supplierName}
                    onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Invoice / PO Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-9902"
                    value={form.sourceReference}
                    onChange={(e) => setForm({ ...form, sourceReference: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted">Receipt Lines</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Line
                  </button>
                </div>

                {form.lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface-muted border border-border rounded-lg space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-medium text-muted">Item *</label>
                        <select
                          required
                          value={line.itemId}
                          onChange={(e) => {
                            const newLines = [...form.lines];
                            newLines[idx]!.itemId = e.target.value;
                            const itm = items.find((i) => i.id === e.target.value);
                            if (itm) newLines[idx]!.uomId = itm.baseUomId;
                            setForm({ ...form, lines: newLines });
                          }}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs"
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
                        <label className="block text-[10px] font-medium text-muted">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          required
                          value={line.quantity}
                          onChange={(e) => {
                            const newLines = [...form.lines];
                            newLines[idx]!.quantity = e.target.value;
                            setForm({ ...form, lines: newLines });
                          }}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-muted">
                          Unit Cost (₹)
                        </label>
                        <input
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) => {
                            const newLines = [...form.lines];
                            newLines[idx]!.unitPrice = e.target.value;
                            setForm({ ...form, lines: newLines });
                          }}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-muted">
                          Batch No (If applicable)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. BATCH-2026-01"
                          value={line.batchNumber}
                          onChange={(e) => {
                            const newLines = [...form.lines];
                            newLines[idx]!.batchNumber = e.target.value;
                            setForm({ ...form, lines: newLines });
                          }}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-muted">
                          Serial Numbers (Comma-separated)
                        </label>
                        <input
                          type="text"
                          placeholder="SN001, SN002..."
                          value={line.serialNumbers}
                          onChange={(e) => {
                            const newLines = [...form.lines];
                            newLines[idx]!.serialNumbers = e.target.value;
                            setForm({ ...form, lines: newLines });
                          }}
                          className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg"
                >
                  Post Goods Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedReceiptForReverse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-red-500">
              Reverse Receipt {selectedReceiptForReverse.receiptNumber}?
            </h3>
            <p className="text-xs text-muted">
              Reversing will create a compensating credit ledger entry and remove the received
              quantities from current stock balances.
            </p>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Reason for Reversal *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Wrong items delivered / Entry error"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedReceiptForReverse(null)}
                className="px-4 py-2 text-sm border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReverseReceipt}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
