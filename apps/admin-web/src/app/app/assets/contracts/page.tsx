'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Plus, RefreshCw, Calendar, Building2, Clock } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';

export default function AssetContractsPage() {
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const res = await api.assetContracts.list({
        organizationId: orgId,
        communityId: commId,
      });
      setContracts(res?.items || []);
    } catch (err) {
      console.error('Failed to load contracts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center space-x-4 border-b border-border pb-5">
        <Link
          href="/app/assets"
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            AMC & Service Contract Registry
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage annual maintenance contracts, SLA service response terms, and covered physical
            asset fleets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            <p>Loading service contracts...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-xl">
            <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-semibold text-foreground">No AMC Contracts Found</p>
          </div>
        ) : (
          contracts.map((c) => (
            <div
              key={c.id}
              className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{c.name}</h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    {c.contractNumber} • Provider: <strong>{c.serviceProviderName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    {c.contractType}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {c.status}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{c.coverageSummary}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-3 border-t border-border">
                <div>
                  <span className="text-muted-foreground block">Contact</span>
                  <span className="font-medium text-foreground">
                    {c.contactEmail || c.contactPhone || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">SLA Response</span>
                  <span className="font-medium text-foreground">
                    {c.slaResponseHours ? `${c.slaResponseHours} Hours` : 'Standard'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Preventive Visits</span>
                  <span className="font-medium text-foreground">
                    {c.preventiveVisitsPerYear} Visits / Year
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Valid Until</span>
                  <span className="font-medium text-foreground">
                    {new Date(c.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
