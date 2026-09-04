'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { DoorOpen, LogOut } from 'lucide-react';

export default function ActiveVisitorsPage() {
  const [activeVisits, setActiveVisits] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const orgs = await api.listOrganizations();
      const orgList = (orgs as any)?.data || (orgs as any) || [];
      if (orgList.length > 0 && orgList[0]?.id) {
        const comms = await api.listCommunitiesForOrganization(orgList[0].id);
        const commList = (comms as any)?.data || (comms as any) || [];
        if (commList.length > 0 && commList[0]?.id) {
          const list = await api.security.getActiveVisits(commList[0].id);
          setActiveVisits(list || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckout = async (visitId: string, gateId: string) => {
    try {
      await api.security.checkOut({ visitId, gateId });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <DoorOpen className="h-6 w-6 text-primary" /> Active Visitors Currently Inside
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time occupancy tracking with manual checkout controls.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {activeVisits.map((v) => (
          <div key={v.id} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">{v.visitorName}</h3>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                INSIDE
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Type: {v.visitType} • Unit: {v.destinationUnitNumber || 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">
              Checked In: {new Date(v.checkInTime).toLocaleTimeString()}
            </p>
            {v.vehicleNumber && (
              <p className="text-xs font-mono font-semibold">Vehicle: {v.vehicleNumber}</p>
            )}
            <button
              onClick={() => handleCheckout(v.visitId, v.entryGateId)}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-border py-1.5 text-xs font-semibold hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" /> Record Exit / Checkout
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
