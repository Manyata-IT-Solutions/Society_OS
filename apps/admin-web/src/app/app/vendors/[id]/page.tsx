'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  Users,
  FileText,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Star,
} from 'lucide-react';

export default function VendorDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [vendor, setVendor] = useState<any>(null);
  const [scorecard, setScorecard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const [v, sc] = await Promise.all([api.vendors.get(id), api.vendors.getScorecard(id)]);
        setVendor(v);
        setScorecard(sc);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading vendor profile...</div>;
  }

  if (!vendor) {
    return <div className="p-8 text-center text-muted">Vendor not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{vendor.displayName}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {vendor.status}
            </span>
          </div>
          <div className="text-xs text-muted font-mono">
            {vendor.vendorCode} • {vendor.legalName}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div>
            <div className="text-xs text-muted">Onboarding</div>
            <div className="font-semibold">{vendor.onboardingStatus}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Risk Rating</div>
            <div className="font-semibold text-emerald-500">{vendor.riskRating}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Performance Score</div>
            <div className="font-bold text-primary text-base">
              {scorecard?.calculatedScore ? `${scorecard.calculatedScore}%` : '100%'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact & Address */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted">
            Contacts & Locations
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted">
              <Mail className="h-4 w-4" /> {vendor.primaryEmail ?? 'Not specified'}
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Phone className="h-4 w-4" /> {vendor.primaryPhone ?? 'Not specified'}
            </div>
          </div>
        </div>

        {/* Statutory & Tax */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted">
            Tax & Statutory Compliance
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted">Payment Terms:</span>
              <span className="font-medium">{vendor.paymentTerms ?? 'Net 30 Days'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted">Country Code:</span>
              <span className="font-medium">{vendor.countryCode}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
