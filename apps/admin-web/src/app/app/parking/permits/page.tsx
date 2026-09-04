'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { QrCode } from 'lucide-react';

export default function PermitsPage() {
  const [permits, setPermits] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const comms = await api.listCommunitiesForOrganization(orgList[0].id);
          const commList = (comms as any)?.data || (comms as any) || [];
          if (commList.length > 0 && commList[0]?.id) {
            const list = await api.parking.getPermits(commList[0].id);
            setPermits(list || []);
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
          <QrCode className="h-6 w-6 text-primary" /> Parking Permits & RFID Access Credentials
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Digital permit identifiers and high-frequency RFID windscreen sticker mappings.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Permit #</th>
              <th className="p-3">Vehicle Plate</th>
              <th className="p-3">Allocated Bay</th>
              <th className="p-3">RFID Tag ID</th>
              <th className="p-3">Valid Until</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {permits.map((p) => (
              <tr key={p.id}>
                <td className="p-3 font-mono font-bold">{p.permitNumber}</td>
                <td className="p-3 font-mono">{p.vehicle?.registrationNumber}</td>
                <td className="p-3 font-semibold">{p.allocation?.parkingSlot?.slotNumber || 'Unallocated'}</td>
                <td className="p-3 font-mono text-muted-foreground">{p.rfidCredentialTag || 'Not Linked'}</td>
                <td className="p-3">{new Date(p.validUntil).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                    {p.status}
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
