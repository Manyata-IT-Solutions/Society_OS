'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Clock } from 'lucide-react';

export default function AmenityWaitlistPage() {
  const [waitlist, setWaitlist] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const comms = await api.listCommunitiesForOrganization(orgList[0].id);
          const commList = (comms as any)?.data || (comms as any) || [];
          if (commList.length > 0 && commList[0]?.id) {
            const amenities = await api.amenities.getAmenities(commList[0].id);
            if (amenities && amenities.length > 0) {
              const list = await api.amenities.getWaitlist(amenities[0].id);
              setWaitlist(list || []);
            }
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
          <Clock className="h-6 w-6 text-primary" /> Live Waitlist Queue & Promotions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time queue for peak-hour court slots and automatic promotions upon cancellation.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Resident</th>
              <th className="p-3">Resource Requested</th>
              <th className="p-3">Desired Time</th>
              <th className="p-3">Party Size</th>
              <th className="p-3">Queued At</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {waitlist.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">No waitlist entries currently active.</td>
              </tr>
            ) : (
              waitlist.map((w) => (
                <tr key={w.id}>
                  <td className="p-3 font-semibold">{w.resident?.displayName || 'Resident'}</td>
                  <td className="p-3">{w.resource?.name || 'Any Available Court'}</td>
                  <td className="p-3 font-mono text-xs">{new Date(w.desiredStartAt).toLocaleString()}</td>
                  <td className="p-3">{w.partySize}</td>
                  <td className="p-3 text-muted-foreground">{new Date(w.createdAt).toLocaleTimeString()}</td>
                  <td className="p-3">
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                      {w.status}
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
