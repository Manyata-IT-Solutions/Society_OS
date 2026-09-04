'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Plus, ShoppingCart, CheckCircle, Clock, AlertCircle, Search, Filter } from 'lucide-react';

export default function PurchaseRequisitionsPage() {
  const [prs, setPrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [requestType, setRequestType] = useState('GOODS');
  const [itemDesc, setItemDesc] = useState('');
  const [qty, setQty] = useState(10);
  const [unitPrice, setUnitPrice] = useState(100);

  const orgId = '00000000-0000-0000-0000-000000000001';
  const commId = '00000000-0000-0000-0000-000000000002';

  async function loadData() {
    try {
      const res = await api.procurement.requisitions.list({ organizationId: orgId, search });
      setPrs(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.procurement.requisitions.create({
        organizationId: orgId,
        communityId: commId,
        title,
        description,
        priority,
        requestType,
        lines: [
          {
            description: itemDesc,
            quantity: Number(qty),
            estimatedUnitPrice: Number(unitPrice),
            lineType: 'NON_CATALOG_ITEM',
          },
        ],
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setItemDesc('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error creating requisition');
    }
  }

  async function handleApprove(id: string) {
    try {
      await api.procurement.requisitions.approve(id, orgId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error approving requisition');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Requisitions</h1>
          <p className="text-sm text-muted">
            Manage demand, approvals, and convert shortages to commercial requests.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Requisition
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search PR number, title, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* PR Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/50 text-muted font-medium text-xs uppercase tracking-wider">
              <th className="p-4">PR Number</th>
              <th className="p-4">Title</th>
              <th className="p-4">Source</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Est. Total</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  Loading requisitions...
                </td>
              </tr>
            ) : prs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  No purchase requisitions found.
                </td>
              </tr>
            ) : (
              prs.map((pr) => (
                <tr key={pr.id} className="hover:bg-surface-muted/30">
                  <td className="p-4 font-mono font-medium text-primary">{pr.requisitionNumber}</td>
                  <td className="p-4 font-medium">{pr.title}</td>
                  <td className="p-4 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-surface-muted border border-border">
                      {pr.sourceType}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-semibold">
                    <span
                      className={
                        pr.priority === 'URGENT' || pr.priority === 'HIGH'
                          ? 'text-red-500'
                          : 'text-muted'
                      }
                    >
                      {pr.priority}
                    </span>
                  </td>
                  <td className="p-4">₹{pr.estimatedTotalAmount?.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      {pr.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {pr.status === 'SUBMITTED' || pr.status === 'DRAFT' ? (
                      <button
                        onClick={() => handleApprove(pr.id)}
                        className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold">Create Purchase Requisition</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Electrical spares for Club House DG Maintenance"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Description / Justification
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                  >
                    <option value="LOW">LOW</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Request Type</label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                  >
                    <option value="GOODS">GOODS</option>
                    <option value="SERVICE">SERVICE</option>
                    <option value="MIXED">MIXED</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Line Item
                </h3>
                <input
                  type="text"
                  required
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Item description / specification"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">
                      Est. Unit Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                >
                  Create Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
