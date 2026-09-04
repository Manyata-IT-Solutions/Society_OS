'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Plus, FileSpreadsheet, Clock, Search, ExternalLink } from 'lucide-react';

export default function RfqsPage() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const orgId = '00000000-0000-0000-0000-000000000001';

  async function loadRfqs() {
    try {
      const res = await api.procurement.rfqs.list({ organizationId: orgId, search });
      setRfqs(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRfqs();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requests For Quotation (RFQ)</h1>
          <p className="text-sm text-muted">
            Manage competitive vendor bidding, invited suppliers, and bid deadlines.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search RFQ number, title..."
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
              <th className="p-4">RFQ Number</th>
              <th className="p-4">Title</th>
              <th className="p-4">Deadline</th>
              <th className="p-4">Status</th>
              <th className="p-4">Quotes</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">
                  Loading RFQs...
                </td>
              </tr>
            ) : rfqs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">
                  No RFQs found.
                </td>
              </tr>
            ) : (
              rfqs.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-surface-muted/30">
                  <td className="p-4 font-mono font-medium text-primary">{rfq.rfqNumber}</td>
                  <td className="p-4 font-medium">{rfq.title}</td>
                  <td className="p-4 text-xs text-muted">
                    {new Date(rfq.submissionDeadline).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {rfq.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs">{rfq.quotations?.length ?? 0} submitted</td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/app/procurement/quotations/compare?rfqId=${rfq.id}`}
                      className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded hover:opacity-90"
                    >
                      Compare Bids <ExternalLink className="h-3 w-3" />
                    </Link>
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
