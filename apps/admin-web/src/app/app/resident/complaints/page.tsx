'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  Ticket,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  Star,
} from 'lucide-react';

export default function ResidentComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.residentComplaints.list();
      setComplaints(res.items || []);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (state: string) => {
    const map: Record<string, string> = {
      NEW: 'bg-blue-500/10 text-blue-500',
      ASSIGNED: 'bg-purple-500/10 text-purple-500',
      IN_PROGRESS: 'bg-amber-500/10 text-amber-500',
      RESOLVED: 'bg-emerald-500/10 text-emerald-500',
      CLOSED: 'bg-zinc-500/20 text-zinc-400',
      REOPENED: 'bg-rose-500/10 text-rose-500',
    };
    return map[state] || 'bg-zinc-500/10 text-zinc-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Household Complaints</h1>
          <p className="text-sm text-muted">
            Track filed service requests, technician updates, resolution status, and submit
            feedback.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadComplaints}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <Link
            href="/app/resident/complaints/new"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" />
            <span>File New Complaint</span>
          </Link>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
            Loading your complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted space-y-3">
            <Ticket className="h-10 w-10 text-muted mx-auto" />
            <div>You have no active or historical complaints.</div>
            <Link
              href="/app/resident/complaints/new"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span>File a Request</span>
            </Link>
          </div>
        ) : (
          complaints.map((c) => (
            <Link
              key={c.id}
              href={`/app/resident/complaints/${c.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-sm hover:border-primary/50 hover:bg-surface-muted/30 transition"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-primary">{c.ticketNumber}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusBadge(c.currentState)}`}
                  >
                    {c.currentState}
                  </span>
                  <span className="text-xs text-muted">• {c.categoryName || 'General'}</span>
                </div>
                <h3 className="font-semibold text-sm text-foreground">{c.title}</h3>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span>Unit: {c.unitNumber ? `Unit ${c.unitNumber}` : c.locationType}</span>
                  <span>Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                  {c.feedbackRating && (
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      {c.feedbackRating}/5
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
