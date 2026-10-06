'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Receipt } from 'lucide-react';

export default function CertificatesPage() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const prjs = await api.projects.getProjects({ organizationId: orgList[0].id });
          if (prjs && prjs.length > 0) {
            const list = await api.projects.getCertificates(prjs[0].id);
            setCerts(list || []);
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
          <Receipt className="h-6 w-6 text-primary" />
          Progress Certificates & Running Account (RA) Bills
        </h1>
        <p className="text-sm text-muted">
          Review approved Interim Payment Certificates, statutory retention withholdings, and AP invoice matching.
        </p>
      </div>

      <div className="space-y-4">
        {certs.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold font-mono">
                {c.certificateNumber}
              </span>
              <h3 className="text-base font-bold text-foreground">Vendor: {c.vendor?.displayName}</h3>
              <p className="text-xs text-muted">Period: {new Date(c.periodStart).toLocaleDateString()} to {new Date(c.periodEnd).toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs text-right">
              <div>
                <div className="text-[10px] text-muted">Gross Certified</div>
                <div className="font-bold text-foreground">₹{Number(c.grossCertifiedAmount).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted">Retention (5%)</div>
                <div className="font-bold text-warning">₹{Number(c.retentionAmount).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted">Net Payable</div>
                <div className="font-bold text-success">₹{Number(c.netCertifiedAmount).toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
