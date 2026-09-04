'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { AlertCircle } from 'lucide-react';

export default function AmenityDamagePage() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const list = await api.amenities.getDamageReports();
        setReports(list || []);
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
          <AlertCircle className="h-6 w-6 text-primary" /> Facility Damage & Deposit Settlements
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Post-event facility inspection, damage deductions, and Phase 14 Billing deposit refunds.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Booking #</th>
              <th className="p-3">Amenity</th>
              <th className="p-3">Damage Description</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Est. Amount</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">No damage reports recorded.</td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id}>
                  <td className="p-3 font-mono font-bold">{r.booking?.bookingNumber}</td>
                  <td className="p-3">{r.amenity?.name}</td>
                  <td className="p-3">{r.description}</td>
                  <td className="p-3">
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                      {r.severity}
                    </span>
                  </td>
                  <td className="p-3 font-bold">₹{Number(r.estimatedAmount || 0).toFixed(0)}</td>
                  <td className="p-3 font-semibold">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
