'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Truck } from 'lucide-react';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const comms = await api.listCommunitiesForOrganization(orgList[0].id);
          const commList = (comms as any)?.data || (comms as any) || [];
          if (commList.length > 0 && commList[0]?.id) {
            const list = await api.security.getDeliveries(commList[0].id);
            setDeliveries(list || []);
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
          <Truck className="h-6 w-6 text-primary" /> Delivery & Cab Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          E-commerce, food delivery, and courier tracking at community gates.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Visit #</th>
              <th className="p-3">Partner / Type</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Status</th>
              <th className="p-3">Arrival Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                  No delivery records found for today.
                </td>
              </tr>
            ) : (
              deliveries.map((d) => (
                <tr key={d.id}>
                  <td className="p-3 font-mono">{d.visitNumber}</td>
                  <td className="p-3 font-semibold">{d.deliveryDetail?.deliveryProvider || 'General Delivery'}</td>
                  <td className="p-3">{d.destinationUnit?.unitNumber || 'Gate Drop'}</td>
                  <td className="p-3 font-semibold">{d.status}</td>
                  <td className="p-3 text-muted-foreground">{new Date(d.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
