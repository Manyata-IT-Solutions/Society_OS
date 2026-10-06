'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { FileCheck, Search, CheckCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const orgId = '00000000-0000-0000-0000-000000000001';

  async function loadPOs() {
    try {
      const res = await api.procurement.orders.list({ organizationId: orgId, search });
      setPos(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPOs();
  }, [search]);

  async function handleIssue(id: string) {
    try {
      await api.procurement.orders.issue(id);
      loadPOs();
    } catch (err: any) {
      alert(err.message || 'Error issuing PO');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted">
            Track binding commercial purchase orders, vendor acknowledgements, and receiving
            progress.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search PO number, vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/50 text-muted font-medium text-xs uppercase tracking-wider">
              <th className="p-4">PO Number</th>
              <th className="p-4">Vendor</th>
              <th className="p-4">Revision</th>
              <th className="p-4">Grand Total</th>
              <th className="p-4">Status</th>
              <th className="p-4">Ack Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  Loading purchase orders...
                </td>
              </tr>
            ) : pos.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  No purchase orders found.
                </td>
              </tr>
            ) : (
              pos.map((po) => (
                <tr key={po.id} className="hover:bg-surface-muted/30">
                  <td className="p-4 font-mono font-medium text-primary">{po.poNumber}</td>
                  <td className="p-4 font-medium">{po.vendorName}</td>
                  <td className="p-4 text-xs">v{po.revision}</td>
                  <td className="p-4 font-semibold">₹{po.grandTotal?.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {po.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-muted">{po.vendorAcknowledgementStatus}</td>
                  <td className="p-4 text-right">
                    {po.status === 'APPROVED' ? (
                      <button
                        onClick={() => handleIssue(po.id)}
                        className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded font-medium hover:opacity-90"
                      >
                        Issue PO
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
