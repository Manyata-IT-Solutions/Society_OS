'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { CheckSquare, Plus, CheckCircle2, Layers } from 'lucide-react';

export default function ChecklistTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';

  async function loadTemplates() {
    try {
      setLoading(true);
      const res = await api.facility.checklists.list({
        organizationId: orgId,
        communityId: commId,
      });
      setTemplates(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            Checklist Templates Catalog
          </h1>
          <p className="text-sm text-muted">
            Standardized operational inspection checklists with required photo proof and validation
            rules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-8 text-center text-sm text-muted">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="col-span-2 py-8 text-center text-sm text-muted">
            No checklist templates configured.
          </div>
        ) : (
          templates.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-primary">
                    {t.code} (v{t.version})
                  </span>
                  <h2 className="font-bold text-sm text-foreground">{t.name}</h2>
                  <div className="text-xs text-muted mt-0.5">
                    {t.categoryName || 'General Facility'}
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                  {t.status}
                </span>
              </div>

              <div className="pt-2 border-t border-border space-y-1.5">
                <div className="text-xs font-semibold text-muted">
                  Inspection Items ({t.items?.length || 0}):
                </div>
                <div className="space-y-1">
                  {t.items?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="text-xs text-foreground flex items-center justify-between bg-surface-muted/40 px-2 py-1 rounded"
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] text-muted font-mono uppercase">
                        {item.itemType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
