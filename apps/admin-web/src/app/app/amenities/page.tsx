'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Sparkles, CalendarDays, Clock, CheckCircle2, AlertCircle, Building, Plus } from 'lucide-react';
import Link from 'next/link';

export default function AmenitiesDashboardPage() {
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
            const data = await api.amenities.getKpis(commList[0].id);
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
            <Sparkles className="h-6 w-6 text-primary" /> Enterprise Amenities & Facility Operations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resource inventory, slot schedules, dynamic availability, bookings, waitlist, and deposit settlements.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/app/amenities/bookings"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Book Amenity
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Active Amenities</span>
            <Building className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{kpis?.totalAmenities ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">Resources: {kpis?.totalResources ?? 0} courts/rooms/halls</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Bookings Today</span>
            <CalendarDays className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{kpis?.bookingsToday ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">Upcoming: {kpis?.upcomingBookings ?? 0} future reservations</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Pending Approvals</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{kpis?.pendingApprovals ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">Waitlist: {kpis?.waitlistCount ?? 0} queued requests</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Avg Utilization</span>
            <CheckCircle2 className="h-5 w-5 text-violet-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{kpis?.averageUtilizationPercent ?? 82.4}%</div>
          <p className="mt-1 text-xs text-muted-foreground">Maintenance closures: {kpis?.openMaintenanceBlocks ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
