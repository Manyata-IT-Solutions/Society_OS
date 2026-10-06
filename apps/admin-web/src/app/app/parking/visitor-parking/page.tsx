'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Clock, DoorOpen } from 'lucide-react';

export default function VisitorParkingPage() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const comms = await api.listCommunitiesForOrganization(orgList[0].id);
          const commList = (comms as any)?.data || (comms as any) || [];
          if (commList.length > 0 && commList[0]?.id) {
            const list = await api.parking.getVisitorSessions(commList[0].id);
            setSessions(list || []);
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
          <Clock className="h-6 w-6 text-primary" /> Visitor Parking Pool & Live Capacity
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time visitor parking bays and automated departure capacity release.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Vehicle Plate</th>
              <th className="p-3">Destination Unit</th>
              <th className="p-3">Host Resident</th>
              <th className="p-3">Assigned Slot</th>
              <th className="p-3">Entry Time</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  No active visitor vehicles currently parked.
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id}>
                  <td className="p-3 font-mono font-bold">{s.vehicleNumber}</td>
                  <td className="p-3">Unit {s.visit?.destinationUnit?.unitNumber || 'N/A'}</td>
                  <td className="p-3">{s.visit?.hostResident?.displayName || 'N/A'}</td>
                  <td className="p-3 font-semibold">{s.parkingSlot?.slotNumber || 'Visitor Zone'}</td>
                  <td className="p-3 text-muted-foreground">{new Date(s.entryTime).toLocaleTimeString()}</td>
                  <td className="p-3">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                      PARKED
                    </span>
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
