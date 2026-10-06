'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  FileSpreadsheet,
  FileCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Building2,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function ProcurementDashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKpis() {
      try {
        const orgId = '00000000-0000-0000-0000-000000000001';
        const res = await api.procurement.analytics.getKpis(orgId);
        setKpis(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadKpis();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Procurement & Sourcing Operations</h1>
          <p className="text-sm text-muted">
            End-to-end procure-to-receive operational cycle, demand tracking, vendor RFQs, and goods
            receipts.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/app/procurement/requisitions"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> New Requisition
          </Link>
          <Link
            href="/app/procurement/rfqs"
            className="flex items-center gap-2 bg-surface border border-border px-4 py-2 rounded-lg font-medium text-sm hover:bg-surface-muted transition-colors"
          >
            Create RFQ
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-muted text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Open Demands (PR)</span>
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? '...' : (kpis?.openRequisitions ?? 0)}
          </div>
          <div className="text-xs text-muted mt-1">
            {kpis?.requisitionsPendingApproval ?? 0} pending maker-checker approval
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-muted text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active RFQs</span>
            <FileSpreadsheet className="h-5 w-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">{loading ? '...' : (kpis?.activeRfqs ?? 0)}</div>
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            {kpis?.rfqsClosingSoon ?? 0} closing within 72 hours
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-muted text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Purchase Orders</span>
            <FileCheck className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">
            {loading ? '...' : (kpis?.openPurchaseOrders ?? 0)}
          </div>
          <div className="text-xs text-muted mt-1">
            {kpis?.purchaseOrdersPendingApproval ?? 0} pending issuance approval
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-muted text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Committed Spend</span>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold">
            ₹{loading ? '...' : (kpis?.totalCommittedSpend ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-muted mt-1">Total approved & issued commitments</div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base mb-1">Purchase Requisitions</h3>
            <p className="text-sm text-muted mb-4">
              Create demand from maintenance work orders, inventory reorder points, or manual
              requirements.
            </p>
          </div>
          <Link
            href="/app/procurement/requisitions"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            Manage Requisitions →
          </Link>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base mb-1">RFQs & Sourcing Award</h3>
            <p className="text-sm text-muted mb-4">
              Publish sealed/open RFQs, invite eligible suppliers, normalize quotations, and approve
              awards.
            </p>
          </div>
          <Link
            href="/app/procurement/rfqs"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            View RFQs & Comparisons →
          </Link>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
              <Truck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base mb-1">Goods Receipts & Inspection</h3>
            <p className="text-sm text-muted mb-4">
              Receive deliveries against POs, record inspection passes/rejections, and post stock to
              Phase 11 Inventory.
            </p>
          </div>
          <Link
            href="/app/procurement/receipts"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            Manage Receipts (GRN) →
          </Link>
        </div>
      </div>
    </div>
  );
}
