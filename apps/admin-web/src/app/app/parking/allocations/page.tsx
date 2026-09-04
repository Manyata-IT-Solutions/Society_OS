'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Key, Plus } from 'lucide-react';

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [rights, setRights] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const comms = await api.listCommunitiesForOrganization(orgList[0].id);
          const commList = (comms as any)?.data || (comms as any) || [];
          if (commList.length > 0 && commList[0]?.id) {
            const aList = await api.parking.getAllocations(commList[0].id);
            setAllocations(aList || []);
            const rList = await api.parking.getRights(commList[0].id);
            setRights(rList || []);
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
          <Key className="h-6 w-6 text-primary" /> Parking Rights & Slot Allocations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unit parking entitlements, permanent assignments, and rotational allocations.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Slot Number</th>
              <th className="p-3">Assigned Unit</th>
              <th className="p-3">Vehicle Plate</th>
              <th className="p-3">Allocation Type</th>
              <th className="p-3">Effective Date</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {allocations.map((a) => (
              <tr key={a.id}>
                <td className="p-3 font-mono font-bold">{a.parkingSlot?.slotNumber}</td>
                <td className="p-3 font-semibold">Unit {a.unit?.unitNumber || 'N/A'}</td>
                <td className="p-3 font-mono">{a.vehicle?.registrationNumber || 'Flexible'}</td>
                <td className="p-3">{a.allocationType}</td>
                <td className="p-3 text-muted-foreground">{new Date(a.validFrom).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
