'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { HardHat } from 'lucide-react';

export default function ContractorsPage() {
  const [authorizations, setAuthorizations] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const comms = await api.listCommunitiesForOrganization(orgList[0].id);
          const commList = (comms as any)?.data || (comms as any) || [];
          if (commList.length > 0 && commList[0]?.id) {
            const list = await api.security.getContractors(commList[0].id);
            setAuthorizations(list || []);
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
          <HardHat className="h-6 w-6 text-primary" /> Contractor & Project Worker Access
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Trade contractor authorizations linked to Phase 12 Vendors and Phase 17 Projects.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {authorizations.map((auth) => (
          <div key={auth.id} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2">
            <h3 className="text-base font-bold">{auth.title}</h3>
            <p className="text-xs text-muted-foreground">
              Vendor: {auth.vendor?.displayName} • Limit: {auth.workerLimit} workers
            </p>
            <p className="text-xs font-semibold">
              Windows: {auth.timeWindows} • Gates: {auth.allowedGates}
            </p>
            <div className="mt-3 space-y-1">
              <p className="text-xs font-bold uppercase text-muted-foreground">Registered Crew:</p>
              {auth.workers?.map((w: any) => (
                <div key={w.id} className="flex justify-between text-xs border border-border rounded p-1.5">
                  <span className="font-semibold">{w.name} ({w.workerReference})</span>
                  <span className="text-muted-foreground">{w.skillTrade}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
