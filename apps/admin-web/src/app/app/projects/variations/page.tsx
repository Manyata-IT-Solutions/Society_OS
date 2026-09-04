'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { GitPullRequest } from 'lucide-react';

export default function VariationsPage() {
  const [variations, setVariations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const prjs = await api.projects.getProjects({ organizationId: orgList[0].id });
          if (prjs && prjs.length > 0) {
            const list = await api.projects.getVariations(prjs[0].id);
            setVariations(list || []);
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
          <GitPullRequest className="h-6 w-6 text-primary" />
          Change Orders & Project Variations
        </h1>
        <p className="text-sm text-muted">
          Formal variation requests evaluated under real-time Phase 16 Budget Control to prevent unbudgeted cost overruns.
        </p>
      </div>

      <div className="space-y-4">
        {variations.map((v) => (
          <div key={v.id} className="rounded-xl border border-border bg-surface p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold font-mono">
                {v.variationNumber}
              </span>
              <h3 className="text-base font-bold text-foreground mt-1">{v.reason}</h3>
              <p className="text-xs text-muted">{v.description}</p>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-foreground">₹{Number(v.estimatedCostImpact).toLocaleString('en-IN')}</div>
              <span className="rounded bg-info/10 text-info px-2.5 py-1 text-xs font-semibold">{v.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
