'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Plus, Users, ShieldCheck, AlertTriangle, Search, Star, ExternalLink } from 'lucide-react';

export default function VendorDirectoryPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const orgId = '00000000-0000-0000-0000-000000000001';

  async function loadVendors() {
    try {
      const res = await api.vendors.list({ organizationId: orgId, search });
      setVendors(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendors();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enterprise Vendor Directory</h1>
          <p className="text-sm text-muted">
            Organization-level vendor masters, tax registrations, compliance certificates, and risk
            ratings.
          </p>
        </div>
        <Link
          href="/app/vendors/onboarding"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Register Vendor
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search vendor code, legal name, tax ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/50 text-muted font-medium text-xs uppercase tracking-wider">
              <th className="p-4">Vendor Code</th>
              <th className="p-4">Display Name / Legal Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Onboarding</th>
              <th className="p-4">Status</th>
              <th className="p-4">Risk</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  Loading vendor directory...
                </td>
              </tr>
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  No vendors found.
                </td>
              </tr>
            ) : (
              vendors.map((v) => (
                <tr key={v.id} className="hover:bg-surface-muted/30">
                  <td className="p-4 font-mono font-medium text-primary">{v.vendorCode}</td>
                  <td className="p-4">
                    <div className="font-semibold flex items-center gap-1.5">
                      {v.displayName}
                      {v.isPreferred && (
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      )}
                    </div>
                    <div className="text-xs text-muted">{v.legalName}</div>
                  </td>
                  <td className="p-4 text-xs font-medium">{v.vendorType}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      {v.onboardingStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {v.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-semibold">
                    <span
                      className={
                        v.riskRating === 'CRITICAL' || v.riskRating === 'HIGH'
                          ? 'text-red-500'
                          : 'text-emerald-500'
                      }
                    >
                      {v.riskRating}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/app/vendors/${v.id}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                    >
                      360 View <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
