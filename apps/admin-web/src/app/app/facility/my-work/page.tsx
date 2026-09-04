'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  HardHat,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function TechnicianMyWorkPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assigned' | 'in_progress'>('assigned');

  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';

  async function loadMyWork() {
    try {
      setLoading(true);
      const res = await api.facility.workOrders.list({
        organizationId: orgId,
        communityId: commId,
        currentState:
          activeTab === 'in_progress' ? 'IN_PROGRESS' : ['ASSIGNED', 'ACCEPTED', 'REWORK_REQUIRED'],
      });
      setWorkOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMyWork();
  }, [activeTab]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Mobile-Friendly Technician Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HardHat className="h-6 w-6 text-amber-500" />
            Technician Operations Console
          </h1>
          <p className="text-xs text-muted">Assigned field work execution and live timers</p>
        </div>
        <Link
          href="/app/facility/team-queue"
          className="rounded-lg bg-surface-muted px-3 py-1.5 text-xs font-semibold hover:bg-surface-elevated border border-border"
        >
          Claim from Queue &rarr;
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-muted border border-border text-xs font-semibold">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'assigned'
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-muted hover:text-foreground'
          }`}
        >
          To Do / Assigned
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'in_progress'
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-muted hover:text-foreground'
          }`}
        >
          In Progress / Active
        </button>
      </div>

      {/* Work Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted">Loading your work tasks...</div>
        ) : workOrders.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-border bg-surface p-6 space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
            <div className="font-semibold text-sm text-foreground">
              No pending tasks in this view
            </div>
            <p className="text-xs text-muted">Check the Team Queue to pick up new work orders.</p>
          </div>
        ) : (
          workOrders.map((wo) => (
            <div
              key={wo.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-primary">
                    {wo.workOrderNumber}
                  </span>
                  <h2 className="font-bold text-sm text-foreground">{wo.title}</h2>
                  <div className="text-xs text-muted mt-0.5">
                    {wo.workType} &bull; Priority:{' '}
                    <span className="font-semibold text-foreground">{wo.priority}</span>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
                  {wo.currentState}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted">
                  Due: {wo.dueAt ? new Date(wo.dueAt).toLocaleDateString() : 'Today'}
                </span>
                <Link
                  href={`/app/facility/work-orders/${wo.id}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Open Workspace <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
