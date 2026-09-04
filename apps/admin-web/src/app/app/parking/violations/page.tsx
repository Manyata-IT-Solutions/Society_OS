'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { AlertCircle } from 'lucide-react';

export default function ViolationsPage() {
  const [violations, setViolations] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const comms = await api.listCommunitiesForOrganization(orgList[0].id);
          const commList = (comms as any)?.data || (comms as any) || [];
          if (commList.length > 0 && commList[0]?.id) {
            const list = await api.parking.getViolations(commList[0].id);
            setViolations(list || []);
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
          <AlertCircle className="h-6 w-6 text-primary" /> Parking Violations & Resident Appeals
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unauthorized parking enforcement, evidence review, and Billing penalty charge emission.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Violation #</th>
              <th className="p-3">Vehicle Plate</th>
              <th className="p-3">Violation Type</th>
              <th className="p-3">Description</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {violations.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  No parking violations reported.
                </td>
              </tr>
            ) : (
              violations.map((v) => (
                <tr key={v.id}>
                  <td className="p-3 font-mono font-bold">{v.violationNumber}</td>
                  <td className="p-3 font-mono">{v.vehicleNumber}</td>
                  <td className="p-3 font-semibold">{v.violationType}</td>
                  <td className="p-3">{v.description}</td>
                  <td className="p-3">
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                      {v.severity}
                    </span>
                  </td>
                  <td className="p-3 font-semibold">{v.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
