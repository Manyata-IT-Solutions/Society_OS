'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Users, ClipboardList, CheckCircle2, ArrowRight } from 'lucide-react';

export default function TeamQueuePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';

  async function loadQueue() {
    try {
      setLoading(true);
      const res = await api.facility.workOrders.list({
        organizationId: orgId,
        communityId: commId,
      });
      // Filter unassigned
      const unassigned = (res.data || []).filter(
        (w: any) =>
          !w.primaryAssigneeId && w.currentState !== 'COMPLETED' && w.currentState !== 'CANCELLED',
      );
      setItems(unassigned);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function handleClaim(id: string) {
    try {
      await api.facility.workOrders.claim(id);
      loadQueue();
    } catch (err: any) {
      alert(err.message || 'Error claiming work order');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Unassigned Team Queue
        </h1>
        <p className="text-sm text-muted">
          Available operational work orders waiting for technician claim or supervisory dispatch.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted border-b border-border text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3">WO Number</th>
                <th className="px-4 py-3">Title & Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Team Assigned</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted">
                    Loading queue...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted">
                    Queue is clear. No unassigned work orders!
                  </td>
                </tr>
              ) : (
                items.map((wo) => (
                  <tr key={wo.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-primary">
                      {wo.workOrderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{wo.title}</div>
                      <div className="text-xs text-muted">
                        {wo.workType} &bull; {wo.categoryName || 'General'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-600">
                        {wo.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {wo.primaryTeamName || 'General Helpdesk'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleClaim(wo.id)}
                        className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Self-Claim
                      </button>
                      <Link
                        href={`/app/facility/work-orders/${wo.id}`}
                        className="rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-surface-muted transition-colors"
                      >
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
