'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Zap } from 'lucide-react';

export default function EVChargingPage() {
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
            const list = await api.parking.getEVSessions(commList[0].id);
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
          <Zap className="h-6 w-6 text-primary" /> EV Charging Bays & Energy Consumption
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Charger Asset mapping, charging sessions, kWh meter readings & Billing charge requests.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Bay #</th>
              <th className="p-3">Vehicle Plate</th>
              <th className="p-3">Resident</th>
              <th className="p-3">Energy (kWh)</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  No EV charging sessions recorded.
                </td>
              </tr>
            ) : (
              sessions.map((e) => (
                <tr key={e.id}>
                  <td className="p-3 font-mono font-bold">{e.parkingSlot?.slotNumber}</td>
                  <td className="p-3 font-mono">{e.vehicle?.registrationNumber}</td>
                  <td className="p-3">{e.resident?.displayName || 'Resident'}</td>
                  <td className="p-3 font-bold">{Number(e.energyConsumedKwh).toFixed(2)} kWh</td>
                  <td className="p-3 text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                      {e.status}
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
