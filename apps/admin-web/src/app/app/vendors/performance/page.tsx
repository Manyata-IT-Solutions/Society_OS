'use client';

import React from 'react';
import { Award, TrendingUp, CheckCircle2, Star } from 'lucide-react';

export default function VendorPerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vendor Performance & Scorecards</h1>
        <p className="text-sm text-muted">
          Deterministic scoring based on On-Time Delivery, Quality Acceptance, Fulfillment, and
          Quote Response rates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="text-xs text-muted font-semibold uppercase">Avg On-Time Delivery</div>
          <div className="text-2xl font-bold text-emerald-500 mt-1">96.4%</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="text-xs text-muted font-semibold uppercase">Quality Acceptance Rate</div>
          <div className="text-2xl font-bold text-emerald-500 mt-1">98.8%</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="text-xs text-muted font-semibold uppercase">PO Fulfillment Rate</div>
          <div className="text-2xl font-bold text-blue-500 mt-1">94.2%</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="text-xs text-muted font-semibold uppercase">RFQ Response Rate</div>
          <div className="text-2xl font-bold text-amber-500 mt-1">88.5%</div>
        </div>
      </div>
    </div>
  );
}
