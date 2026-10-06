'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  Ticket,
  Search,
  Filter,
  RefreshCw,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  User,
  Building,
} from 'lucide-react';

export default function HelpdeskTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [page, priorityFilter, stateFilter, unassignedOnly]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (priorityFilter) params.priority = priorityFilter;
      if (stateFilter) params.currentState = stateFilter;
      if (unassignedOnly) params.unassignedOnly = true;

      const res = await api.helpdesk.listTickets(params);
      setTickets(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setTickets([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTickets();
  };

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      LOW: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
      NORMAL: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      HIGH: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      URGENT: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return map[priority] || map.NORMAL;
  };

  const getStateBadge = (state: string) => {
    const map: Record<string, string> = {
      NEW: 'bg-blue-500/10 text-blue-500',
      TRIAGED: 'bg-indigo-500/10 text-indigo-500',
      ASSIGNED: 'bg-purple-500/10 text-purple-500',
      IN_PROGRESS: 'bg-amber-500/10 text-amber-500',
      ON_HOLD: 'bg-zinc-500/10 text-zinc-500',
      RESOLVED: 'bg-emerald-500/10 text-emerald-500',
      CLOSED: 'bg-zinc-500/20 text-zinc-400',
      REOPENED: 'bg-rose-500/10 text-rose-500',
      CANCELLED: 'bg-zinc-500/10 text-zinc-500 line-through',
    };
    return map[state] || 'bg-zinc-500/10 text-zinc-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets & Complaints</h1>
          <p className="text-sm text-muted">
            Multi-community complaint registry, triage, SLA tracking, and workflow resolution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadTickets}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search by ticket # (e.g. TKT-2026-00001), title, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-muted pl-9 pr-4 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <select
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
          >
            <option value="">All States</option>
            <option value="NEW">New</option>
            <option value="TRIAGED">Triaged</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REOPENED">Reopened</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setUnassignedOnly(!unassignedOnly);
              setPage(1);
            }}
            className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
              unassignedOnly ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'border-border'
            }`}
          >
            Unassigned Only
          </button>

          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Tickets Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/50 text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Location / Unit</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">SLA Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    Loading tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    No tickets found matching your criteria.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-surface-muted/30 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{ticket.ticketNumber}</div>
                      <div className="text-xs text-muted line-clamp-1">{ticket.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium">{ticket.categoryName || 'General'}</div>
                      {ticket.subcategoryName && (
                        <div className="text-[10px] text-muted">{ticket.subcategoryName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getPriorityBadge(
                          ticket.priority,
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStateBadge(
                          ticket.currentState,
                        )}`}
                      >
                        {ticket.currentState}
                      </span>
                      {ticket.reopenCount > 0 && (
                        <span className="ml-1 text-[10px] text-rose-500 font-medium">
                          (Reopened {ticket.reopenCount}x)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium">
                        {ticket.unitNumber ? `Unit ${ticket.unitNumber}` : ticket.locationType}
                      </div>
                      {ticket.buildingName && (
                        <div className="text-[10px] text-muted">{ticket.buildingName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        {ticket.assignedUserName || ticket.assignedTeamName || (
                          <span className="text-amber-500 font-medium">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {ticket.slaStatus ? (
                        <span
                          className={`inline-flex items-center text-[11px] font-medium ${
                            ticket.slaStatus === 'BREACHED'
                              ? 'text-red-500 font-semibold'
                              : ticket.slaStatus === 'COMPLETED'
                                ? 'text-emerald-500'
                                : 'text-blue-500'
                          }`}
                        >
                          {ticket.slaStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/app/helpdesk/tickets/${ticket.id}`}
                        className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-medium hover:bg-surface-muted transition"
                      >
                        <span>View</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
          <div>
            Showing {tickets.length} of {total} tickets
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded border border-border px-2.5 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              disabled={tickets.length < 20}
              onClick={() => setPage(page + 1)}
              className="rounded border border-border px-2.5 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
