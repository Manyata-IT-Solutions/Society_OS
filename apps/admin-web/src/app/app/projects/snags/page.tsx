'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { AlertCircle } from 'lucide-react';

export default function SnagsPage() {
  const [snags, setSnags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const prjs = await api.projects.getProjects({ organizationId: orgList[0].id });
          if (prjs && prjs.length > 0) {
            const list = await api.projects.getSnags(prjs[0].id);
            setSnags(list || []);
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
          <AlertCircle className="h-6 w-6 text-primary" />
          Punch List & Quality Snags
        </h1>
        <p className="text-sm text-muted">
          Defects and snag list items. Open blocking snags prevent handover completion.
        </p>
      </div>

      <div className="space-y-3">
        {snags.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-surface p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="rounded bg-warning/10 text-warning px-2 py-0.5 text-[10px] font-bold uppercase">
                {s.severity} Severity
              </span>
              <h3 className="text-sm font-bold text-foreground mt-1">{s.title}</h3>
              <p className="text-xs text-muted">{s.description}</p>
            </div>
            <span className="rounded bg-surface-muted text-foreground px-2.5 py-1 text-xs font-semibold">{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
