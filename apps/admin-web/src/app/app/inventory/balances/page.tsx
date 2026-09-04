'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Layers, History, Search, Filter, Warehouse, CheckCircle, ArrowDownUp } from 'lucide-react';

export default function StockBalancesAndLedgerPage() {
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';
  const [activeTab, setActiveTab] = useState<'balances' | 'ledger'>('balances');
  const [balances, setBalances] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [storeRes, balRes, ledRes] = await Promise.all([
        api.inventory.stores.list({
          organizationId: orgId,
          communityId: commId,
        }),
        api.inventory.balances.list({
          organizationId: orgId,
          communityId: commId,
          storeId: selectedStore || undefined,
        }),
        api.inventory.balances.getLedger({
          organizationId: orgId,
          communityId: commId,
          storeId: selectedStore || undefined,
        }),
      ]);
      setStores(storeRes || []);
      setBalances(balRes.data || []);
      setLedger(ledRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId, commId, selectedStore]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Balances & Immutable Ledger</h1>
          <p className="text-muted text-sm">
            Real-time multi-location stock positions and complete audit journal of all stock
            mutations.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface-muted p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('balances')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'balances'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Layers className="h-4 w-4" /> Balances Projection
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <History className="h-4 w-4" /> Stock Ledger (Journal)
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-border">
        <Warehouse className="h-4 w-4 text-muted" />
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm"
        >
          <option value="">All Stores & Warehouses</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
      </div>

      {activeTab === 'balances' ? (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted border-b border-border text-xs uppercase text-muted font-semibold">
              <tr>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Item Code & Name</th>
                <th className="px-4 py-3">Batch / Lot</th>
                <th className="px-4 py-3">Bin</th>
                <th className="px-4 py-3 text-right">On Hand</th>
                <th className="px-4 py-3 text-right">Reserved</th>
                <th className="px-4 py-3 text-right">Available</th>
                <th className="px-4 py-3 text-right">Valuation Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    Loading stock balances...
                  </td>
                </tr>
              ) : balances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    No active stock balances found in this store.
                  </td>
                </tr>
              ) : (
                balances.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{b.store?.name || b.storeId}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{b.item?.name}</div>
                      <div className="font-mono text-xs text-muted">{b.item?.itemCode}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {b.batch?.batchNumber || '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{b.bin?.code || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {b.quantityOnHand} {b.item?.baseUom?.symbol}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-amber-500">
                      {b.quantityReserved}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-500">
                      {b.quantityAvailable}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {b.valuationRate ? '₹' + b.valuationRate : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted border-b border-border text-xs uppercase text-muted font-semibold">
              <tr>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Transaction Type</th>
                <th className="px-4 py-3">Store & Item</th>
                <th className="px-4 py-3 text-right">Delta</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Actor / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    Loading stock ledger...
                  </td>
                </tr>
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    No ledger entries recorded yet.
                  </td>
                </tr>
              ) : (
                ledger.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-surface-muted/50 transition-colors font-mono text-xs"
                  >
                    <td className="px-4 py-3 text-muted">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded font-semibold bg-surface-muted text-foreground border border-border">
                        {entry.transactionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <div className="font-semibold">{entry.item?.name || entry.itemId}</div>
                      <div className="text-xs text-muted">{entry.store?.name || entry.storeId}</div>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        Number(entry.quantityDelta) > 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}
                    >
                      {Number(entry.quantityDelta) > 0
                        ? '+' + entry.quantityDelta
                        : entry.quantityDelta}{' '}
                      {entry.uom}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {entry.referenceType}:{' '}
                      {entry.referenceId ? entry.referenceId.slice(0, 8) : '-'}
                    </td>
                    <td className="px-4 py-3 font-sans text-xs text-muted">{entry.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
