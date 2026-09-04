'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Download,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function AuditTrailPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.audit.list({
        search: search || undefined,
        action: actionFilter || undefined,
        page,
        limit: 20,
      });
      setRecords(res?.items || []);
      setTotal(res?.total || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleOpenDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await api.audit.get(id);
      setSelectedRecord(res);
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportCsv = () => {
    const url = api.audit.getExportUrl({
      search: search || undefined,
      action: actionFilter || undefined,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enterprise Audit Trail</h1>
          <p className="text-sm text-muted">
            Immutable, append-only chronological record of all administrative and domain events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRecords}
            className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-muted transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-lg border border-border bg-surface p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search action or resource..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-xs focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
          >
            <option value="">All Event Actions</option>
            <option value="organization.create">organization.create</option>
            <option value="community.create">community.create</option>
            <option value="resident.create">resident.create</option>
            <option value="occupancy.move_in">occupancy.move_in</option>
            <option value="document.create">document.create</option>
            <option value="user.created">user.created</option>
          </select>
        </div>
        <div className="flex items-center justify-end text-xs text-muted">
          Showing {records.length} of {total} records
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface-muted/50 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp (UTC)</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Resource Type</th>
                <th className="px-4 py-3 font-medium">Resource ID</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium">Classification</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    Loading audit trail...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    No audit records match the current filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-muted whitespace-nowrap">
                      {new Date(r.occurredAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-primary text-[10px]">
                        {r.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 uppercase tracking-wider text-[10px] text-muted">
                      {r.resourceType}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted truncate max-w-[120px]">
                      {r.resourceId || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className="text-[10px] font-mono">{r.actorType}</span>
                    </td>
                    <td className="px-4 py-3">
                      {r.result === 'SUCCESS' && (
                        <span className="inline-flex items-center gap-1 rounded bg-green-500/10 px-2 py-0.5 text-green-600 text-[10px] font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          SUCCESS
                        </span>
                      )}
                      {r.result === 'FAILURE' && (
                        <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-red-600 text-[10px] font-medium">
                          <XCircle className="h-3 w-3" />
                          FAILURE
                        </span>
                      )}
                      {r.result === 'DENIED' && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-amber-600 text-[10px] font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          DENIED
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted text-[10px]">{r.classification}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenDetail(r.id)}
                        className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] font-medium hover:bg-surface-muted transition-colors"
                      >
                        <Eye className="h-3 w-3 text-muted" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-base font-semibold">Audit Record Inspector</h3>
                  <p className="text-xs text-muted font-mono">{selectedRecord.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded p-1 text-muted hover:bg-surface-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface-muted/50 p-4">
                <div>
                  <span className="text-muted block text-[10px] uppercase">Action</span>
                  <span className="font-semibold">{selectedRecord.action}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase">Occurred At</span>
                  <span className="font-mono">
                    {new Date(selectedRecord.occurredAt).toISOString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase">Resource Type & ID</span>
                  <span>
                    {selectedRecord.resourceType} / {selectedRecord.resourceId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase">Actor</span>
                  <span>
                    {selectedRecord.actorType} (ID: {selectedRecord.actorId || 'N/A'})
                  </span>
                </div>
              </div>

              {/* Event Metadata */}
              <div>
                <h4 className="font-semibold text-xs mb-1">Event Payload & Metadata</h4>
                <pre className="max-h-48 overflow-y-auto rounded-lg bg-background p-3 font-mono text-[11px] text-muted border border-border">
                  {JSON.stringify(selectedRecord.metadata, null, 2)}
                </pre>
              </div>

              {/* Change Diffs */}
              {selectedRecord.changes && (
                <div>
                  <h4 className="font-semibold text-xs mb-1">State Diff (Before / After)</h4>
                  <pre className="max-h-48 overflow-y-auto rounded-lg bg-background p-3 font-mono text-[11px] text-muted border border-border">
                    {JSON.stringify(selectedRecord.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
