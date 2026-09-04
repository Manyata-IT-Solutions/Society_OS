'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Car, Key, DoorOpen, Zap, AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ParkingDashboardPage() {
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
            const data = await api.parking.getKpis(commList[0].id);
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
            <Car className="h-6 w-6 text-primary" /> Enterprise Parking & Vehicle Operations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resident fleet registry, slot allocation matrix, visitor pool, EV charging & violation governance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/app/parking/allocations"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Key className="h-4 w-4" /> Allocate Slot
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Total Slots</span>
            <DoorOpen className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{kpis?.totalSlots ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">Allocated: {kpis?.allocatedSlots ?? 0} • Available: {kpis?.availableSlots ?? 0}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Registered Vehicles</span>
            <Car className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{kpis?.registeredVehicles ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">Resident & tenant authorized fleet</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Visitor Capacity</span>
            <DoorOpen className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{kpis?.visitorOccupied ?? 0} / {kpis?.visitorCapacity ?? 20}</div>
          <p className="mt-1 text-xs text-muted-foreground">Currently occupied visitor bays</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Open Violations</span>
            <AlertCircle className="h-5 w-5 text-rose-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold">{kpis?.openViolations ?? 0}</div>
          <p className="mt-1 text-xs text-muted-foreground">Awaiting review or penalty billing</p>
        </div>
      </div>
    </div>
  );
}
