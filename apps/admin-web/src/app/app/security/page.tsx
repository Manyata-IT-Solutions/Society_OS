'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Shield, UserCheck, DoorOpen, Truck, AlertCircle, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function SecurityDashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const comms = await api.listCommunitiesForOrganization(orgList[0].id);
          const commList = (comms as any)?.data || (comms as any) || [];
          if (commList.length > 0 && commList[0]?.id) {
            const data = await api.security.getKpis(commList[0].id);
            setKpis(data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Security & Gate Operations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time physical access control, visitor pre-approvals, delivery tracking & watchlist governance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/app/security/gate-app"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <QrCode className="h-4 w-4" /> Open Guard Terminal
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Active Inside</span>
            <DoorOpen className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{kpis?.activeVisitorsCount ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">Visitors & staff currently inside</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Pending Approvals</span>
            <UserCheck className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{kpis?.pendingApprovalsCount ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">Awaiting resident confirmation</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Deliveries Today</span>
            <Truck className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{kpis?.deliveriesTodayCount ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">Food, e-commerce & courier drops</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Watchlist Alerts</span>
            <AlertCircle className="h-5 w-5 text-rose-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{kpis?.watchlistAlertsCount ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">Active restricted subjects</p>
        </div>
      </div>
    </div>
  );
}
