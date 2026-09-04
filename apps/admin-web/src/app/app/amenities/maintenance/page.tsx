'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Wrench } from 'lucide-react';

export default function AmenityMaintenancePage() {
  const [blocks, setBlocks] = useState<any[]>([]);

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
              const list = await api.amenities.getMaintenanceBlocks(amenities[0].id);
              setBlocks(list || []);
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
          <Wrench className="h-6 w-6 text-primary" /> Maintenance Blocks & Facility Closures
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Temporary resource closures linked to Phase 9 WorkOrders or Phase 17 CAPEX Projects.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Resource</th>
              <th className="p-3">Closure Reason</th>
              <th className="p-3">Start Window</th>
              <th className="p-3">End Window</th>
              <th className="p-3">Linked Work Order</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {blocks.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">No active maintenance blocks.</td>
              </tr>
            ) : (
              blocks.map((b) => (
                <tr key={b.id}>
                  <td className="p-3 font-semibold">{b.resource?.name || 'Entire Amenity'}</td>
                  <td className="p-3">{b.reason}</td>
                  <td className="p-3 font-mono text-xs">{new Date(b.startAt).toLocaleString()}</td>
                  <td className="p-3 font-mono text-xs">{new Date(b.endAt).toLocaleString()}</td>
                  <td className="p-3 font-mono">{b.workOrderId || 'N/A'}</td>
                  <td className="p-3">
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                      {b.status}
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
