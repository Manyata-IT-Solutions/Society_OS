'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Truck, CheckCircle2, AlertTriangle, Search, PackageCheck } from 'lucide-react';

export default function GoodsReceiptNotesPage() {
  const [grns, setGrns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const orgId = '00000000-0000-0000-0000-000000000001';

  async function loadGrns() {
    try {
      const res = await api.procurement.receipts.list({ organizationId: orgId, search });
      setGrns(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGrns();
  }, [search]);

  async function handlePost(id: string) {
    try {
      await api.procurement.receipts.postToInventory(id);
      alert('GRN posted to Phase 11 Inventory stock successfully!');
      loadGrns();
    } catch (err: any) {
      alert(err.message || 'Error posting GRN to inventory');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goods Receipt Notes (GRN)</h1>
          <p className="text-sm text-muted">
            Receive physical materials against POs, inspect accepted/rejected quantities, and post
            to inventory.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/50 text-muted font-medium text-xs uppercase tracking-wider">
              <th className="p-4">GRN Number</th>
              <th className="p-4">PO Ref</th>
              <th className="p-4">Vendor</th>
              <th className="p-4">Store</th>
              <th className="p-4">Inspection</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  Loading goods receipt notes...
                </td>
              </tr>
            ) : grns.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  No Goods Receipt Notes recorded.
                </td>
              </tr>
            ) : (
              grns.map((grn) => (
                <tr key={grn.id} className="hover:bg-surface-muted/30">
                  <td className="p-4 font-mono font-medium text-primary">{grn.grnNumber}</td>
                  <td className="p-4 font-mono text-xs">{grn.poNumber}</td>
                  <td className="p-4 font-medium">{grn.vendorName}</td>
                  <td className="p-4 text-xs">{grn.storeName ?? 'Main Warehouse'}</td>
                  <td className="p-4 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-surface-muted border border-border">
                      {grn.inspectionStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {grn.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {grn.status === 'RECEIVED' || grn.status === 'ACCEPTED' ? (
                      <button
                        onClick={() => handlePost(grn.id)}
                        className="text-xs bg-emerald-600 text-white px-3 py-1 rounded font-medium hover:bg-emerald-700"
                      >
                        Post to Stock
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
