'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { DoorOpen, Zap, Shield, Ban } from 'lucide-react';

export default function SlotsGridPage() {
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const comms = await api.listCommunitiesForOrganization(orgList[0].id);
          const commList = (comms as any)?.data || (comms as any) || [];
          if (commList.length > 0 && commList[0]?.id) {
            const list = await api.parking.getSlots(commList[0].id);
            setSlots(list || []);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <DoorOpen className="h-6 w-6 text-primary" /> Visual Parking Slot Matrix & Inventory
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive floor/area grid showing allocated, available, EV-ready, and blocked bays.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {slots.map((s) => {
          const isAllocated = s.allocations && s.allocations.length > 0;
          const isBlocked = s.status === 'BLOCKED';
          return (
            <div
              key={s.id}
              className={`rounded-xl border p-4 shadow-sm space-y-2 ${
                isBlocked
                  ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20'
                  : isAllocated
                  ? 'border-primary/40 bg-card'
                  : 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-base">{s.slotNumber}</span>
                {s.isEvEnabled && <Zap className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-muted-foreground uppercase">{s.slotType}</p>
              {isAllocated ? (
                <div className="text-xs font-semibold text-primary">
                  Unit {s.allocations[0]?.unit?.unitNumber || 'Allocated'}
                </div>
              ) : isBlocked ? (
                <div className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <Ban className="h-3 w-3" /> Blocked
                </div>
              ) : (
                <div className="text-xs font-semibold text-emerald-600">Available</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
