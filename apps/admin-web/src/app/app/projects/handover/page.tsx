'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { CheckCircle2 } from 'lucide-react';

export default function HandoverPage() {
  const [handovers, setHandovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const prjs = await api.projects.getProjects({ organizationId: orgList[0].id });
          if (prjs && prjs.length > 0) {
            const list = await api.projects.getHandovers(prjs[0].id);
            setHandovers(list || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          Project Handover & Asset Onboarding
        </h1>
        <p className="text-sm text-muted">
          Formal handover protocols, statutory certifications, and automated dispatch to Phase 10 Asset Management.
        </p>
      </div>

      <div className="space-y-4">
        {handovers.map((h) => (
          <div key={h.id} className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold font-mono">
                  {h.handoverNumber}
                </span>
                <h3 className="text-base font-bold text-foreground mt-1">From: {h.handoverFrom} ➔ To: {h.handoverTo}</h3>
                <p className="text-xs text-muted">Date: {new Date(h.handoverDate).toLocaleDateString()}</p>
              </div>
              <span className="rounded bg-success/10 text-success px-2.5 py-1 text-xs font-semibold">{h.status}</span>
            </div>

            <div className="border-t border-border pt-3 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted text-[10px]">Warranty Start</span>
                <div className="font-bold text-foreground">{h.warrantyStartDate ? new Date(h.warrantyStartDate).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div>
                <span className="text-muted text-[10px]">Defect Liability Period (DLP)</span>
                <div className="font-bold text-foreground">
                  {h.defectLiabilityStartDate ? new Date(h.defectLiabilityStartDate).toLocaleDateString() : 'N/A'} to {h.defectLiabilityEndDate ? new Date(h.defectLiabilityEndDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
